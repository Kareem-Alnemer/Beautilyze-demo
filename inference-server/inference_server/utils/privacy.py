"""
Privacy utilities for image handling.
Per blueprint §8.4: images held in memory only, not written to disk, not logged.
"""
import gc
from typing import Any


def discard_image_data(data: Any) -> None:
    """
    Explicitly discard image data from memory.
    In Python, this means deleting references and forcing garbage collection.
    """
    if data is not None:
        # Delete the reference
        del data
        # Force garbage collection to reclaim memory
        gc.collect()


def ensure_no_temp_files(path: str) -> None:
    """
    Verify no temporary files were created at the given path.
    Raises AssertionError if files exist.
    """
    import os
    if os.path.exists(path):
        files = os.listdir(path)
        assert len(files) == 0, f"Temporary files found in {path}: {files}"


class ImageDataContext:
    """
    Context manager for image data that ensures cleanup on exit.
    Usage:
        with ImageDataContext(image_bytes) as img:
            result = process(img)
        # img is automatically discarded on exit
    """
    
    def __init__(self, data: bytes):
        self.data = data
    
    def __enter__(self) -> bytes:
        return self.data
    
    def __exit__(self, exc_type, exc_val, exc_tb) -> None:
        discard_image_data(self.data)
        self.data = None