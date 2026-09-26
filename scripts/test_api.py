import io
from pathlib import Path
from PIL import Image
from fastapi.testclient import TestClient
from inference_server.main import app

client = TestClient(app)

# 1. Search for existing test images in common extensions
datasets_dir = Path("../datasets")
image_extensions = ("*.jpg", "*.jpeg", "*.png", "*.JPG", "*.JPEG", "*.PNG")
image_files = []

if datasets_dir.exists():
    for ext in image_extensions:
        image_files.extend(list(datasets_dir.rglob(ext)))

# 2. Use found image or fallback to creating an in-memory sample image
if image_files:
    sample_img_path = image_files[0]
    print(f"Testing with existing image: {sample_img_path}")
    with open(sample_img_path, "rb") as f:
        img_bytes = f.read()
else:
    print("No dataset images found. Generating a synthetic test image in memory...")
    img = Image.new("RGB", (224, 224), color=(200, 150, 130))
    buffer = io.BytesIO()
    img.save(buffer, format="JPEG")
    img_bytes = buffer.getvalue()

# 3. Test POST /analyze
response = client.post(
    "/analyze",
    files={"file": ("test_sample.jpg", img_bytes, "image/jpeg")}
)

print(f"\nStatus Code: {response.status_code}")
print("Response Body:")
print(response.json())