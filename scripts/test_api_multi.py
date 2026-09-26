from fastapi.testclient import TestClient
from inference_server.main import app
from pathlib import Path

client = TestClient(app)

test_images = [
    ('../datasets/skin_type/train/dry/dry_003e3600c061a59dc809_jpg.rf.05f5bf4c0b947c4680a7e891e5b6ecb8.jpg', 'dry skin'),
    ('../datasets/skin_type/train/oily/oily_0033afe2a6242dbbf7b4-Copy_jpg.rf.cff7d0a0d16ba32509c01f858591178c.jpg', 'oily skin'),
    ('../datasets/acne/train/moderate/Papules_papular_acne_-100-_jpg.rf.0cb7c7dfad4f73fe890b6daf38529ded.jpg', 'moderate acne'),
    ('../datasets/acne/train/severe/Cyst_Acne-cyst-1-150x150_jpg.rf.4bcbc5c15016cca99435daa0196e651c.jpg', 'severe acne'),
]

for img_path, desc in test_images:
    p = Path(img_path)
    if p.exists():
        with open(p, 'rb') as f:
            response = client.post('/analyze', files={'file': ('test.jpg', f, 'image/jpeg')})
        data = response.json()
        st = data['data']['skin_type']
        ac = data['data']['acne_severity']
        print(f'{desc}: skin_type={st["label"]} ({st["confidence"]:.2%}), acne={ac["label"]} ({ac["confidence"]:.2%})')
    else:
        print(f'{desc}: NOT FOUND at {img_path}')