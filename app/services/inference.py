"""
Inference service for BeautiLyze.
Loads trained PyTorch models and runs inference on image bytes.
"""

import io
import torch
import torch.nn as nn
from torchvision import models, transforms
from PIL import Image
from pathlib import Path
from typing import Dict, Any


# Global model cache
_skin_type_model = None
_acne_model = None
_skin_type_classes = None
_acne_classes = None
_transform = None


def _get_transform():
    """Get the image preprocessing transform."""
    global _transform
    if _transform is None:
        _transform = transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
        ])
    return _transform


def _build_model(num_classes: int):
    """Build MobileNetV3-Small with custom classifier head."""
    model = models.mobilenet_v3_small(weights=None)
    in_features = model.classifier[3].in_features
    model.classifier[3] = nn.Linear(in_features, num_classes)
    return model


def _load_model(checkpoint_path: Path, num_classes: int):
    """Load model from checkpoint."""
    model = _build_model(num_classes)
    checkpoint = torch.load(checkpoint_path, map_location="cpu")
    model.load_state_dict(checkpoint["model_state"])
    model.eval()
    return model


def _get_skin_type_model():
    """Lazy load skin type model."""
    global _skin_type_model, _skin_type_classes
    if _skin_type_model is None:
        checkpoint_path = Path("models/skin_type_best.pt")
        checkpoint = torch.load(checkpoint_path, map_location="cpu")
        _skin_type_classes = checkpoint["classes"]
        _skin_type_model = _load_model(checkpoint_path, len(_skin_type_classes))
    return _skin_type_model, _skin_type_classes


def _get_acne_model():
    """Lazy load acne severity model."""
    global _acne_model, _acne_classes
    if _acne_model is None:
        checkpoint_path = Path("models/acne_best.pt")
        checkpoint = torch.load(checkpoint_path, map_location="cpu")
        _acne_classes = checkpoint["classes"]
        _acne_model = _load_model(checkpoint_path, len(_acne_classes))
    return _acne_model, _acne_classes


def run_inference(image_bytes: bytes) -> Dict[str, Any]:
    """
    Run inference on image bytes.
    
    Args:
        image_bytes: Raw image bytes (JPEG, PNG, etc.)
        
    Returns:
        Dictionary with skin_type and acne_severity predictions:
        {
            "skin_type": {"label": str, "confidence": float},
            "acne_severity": {"label": str, "confidence": float}
        }
    """
    # Load and preprocess image
    image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    transform = _get_transform()
    input_tensor = transform(image).unsqueeze(0)  # Add batch dimension
    
    # Get models
    skin_type_model, skin_type_classes = _get_skin_type_model()
    acne_model, acne_classes = _get_acne_model()
    
    # Run inference
    with torch.no_grad():
        # Skin type prediction
        skin_type_logits = skin_type_model(input_tensor)
        skin_type_probs = torch.softmax(skin_type_logits, dim=1)
        skin_type_conf, skin_type_idx = skin_type_probs.max(1)
        skin_type_label = skin_type_classes[skin_type_idx.item()]
        skin_type_confidence = skin_type_conf.item()
        
        # Acne severity prediction
        acne_logits = acne_model(input_tensor)
        acne_probs = torch.softmax(acne_logits, dim=1)
        acne_conf, acne_idx = acne_probs.max(1)
        acne_label = acne_classes[acne_idx.item()]
        acne_confidence = acne_conf.item()
    
    return {
        "skin_type": {
            "label": skin_type_label,
            "confidence": round(skin_type_confidence, 4)
        },
        "acne_severity": {
            "label": acne_label,
            "confidence": round(acne_confidence, 4)
        }
    }


if __name__ == "__main__":
    # Quick test when run directly
    import sys
    
    # Find a sample image
    sample_paths = [
        Path("datasets/skin_type/train/normal"),
        Path("datasets/skin_type/train/dry"),
        Path("datasets/skin_type/train/oily"),
        Path("datasets/skin_type/train/combination"),
        Path("datasets/acne/train/mild"),
        Path("datasets/acne/train/moderate"),
        Path("datasets/acne/train/severe"),
    ]
    
    test_image = None
    for p in sample_paths:
        if p.exists():
            images = list(p.glob("*.*"))
            if images:
                test_image = images[0]
                break
    
    if test_image is None:
        print("No sample images found in datasets/")
        sys.exit(1)
    
    print(f"Testing with: {test_image}")
    
    with open(test_image, "rb") as f:
        image_bytes = f.read()
    
    result = run_inference(image_bytes)
    print("\nInference Result:")
    print(result)