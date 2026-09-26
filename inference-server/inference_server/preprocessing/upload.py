"""Bounded in-memory upload parsing; never create UploadFile temporary files."""
from email import policy
from email.parser import BytesParser
from fastapi import HTTPException, Request
from inference_server.config import settings
from inference_server.preprocessing.image import validate_image_content_type, validate_image_size


async def read_image_upload(request: Request) -> bytes:
    limit = settings.max_file_size_mb * 1024 * 1024
    # Allow bounded multipart headers in addition to the image payload.
    body_limit = limit + 64 * 1024
    content_type = request.headers.get("content-type", "")
    if "\r" in content_type or "\n" in content_type:
        raise HTTPException(400, "Invalid content type")
    body = bytearray()
    async for chunk in request.stream():
        if len(body) + len(chunk) > body_limit:
            raise HTTPException(413, "File too large")
        body.extend(chunk)
    if content_type.startswith("multipart/form-data"):
        message = BytesParser(policy=policy.default).parsebytes(
            b"Content-Type: " + content_type.encode("ascii") + b"\r\nMIME-Version: 1.0\r\n\r\n" + bytes(body)
        )
        if not message.is_multipart() or message.defects:
            raise HTTPException(400, "Invalid multipart upload")
        parts = list(message.iter_parts())
        if len(parts) != 1 or parts[0].get_param("name", header="content-disposition") != "file":
            raise HTTPException(422, "Exactly one image file is required")
        part = parts[0]
        image_bytes = part.get_payload(decode=True)
        content_type = part.get_content_type()
    else:
        image_bytes = bytes(body)
    if not image_bytes:
        raise HTTPException(422, "Image file is required")
    validate_image_content_type(content_type)
    if len(image_bytes) > limit:
        raise HTTPException(413, "File too large")
    validate_image_size(len(image_bytes))
    return image_bytes
