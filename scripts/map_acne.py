#!/usr/bin/env python3
"""
Map acne lesion types to severity levels.

Organizes datasets/acne_raw into datasets/acne with three severity classes:
- mild: Blackheads, Whiteheads
- moderate: Papules, Pustules
- severe: Cysts
"""

import shutil
from pathlib import Path

SOURCE = Path("datasets/acne_raw")
TARGET = Path("datasets/acne")

# Mapping rules
MAPPING = {
    "mild": ["Blackheads", "Whiteheads"],
    "moderate": ["Papules", "Pustules"],
    "severe": ["Cyst"]
}

print("Grouping acne lesions into severity levels...")

for split in ["train", "valid", "test"]:
    split_src = SOURCE / split
    if not split_src.exists():
        continue
        
    for target_class, source_folders in MAPPING.items():
        dest_dir = TARGET / split / target_class
        dest_dir.mkdir(parents=True, exist_ok=True)
        
        copied_count = 0
        for src_folder in source_folders:
            folder_path = split_src / src_folder
            if folder_path.exists():
                for img in folder_path.glob("*.*"):
                    shutil.copy(img, dest_dir / f"{src_folder}_{img.name}")
                    copied_count += 1
                    
        print(f" [{split}] -> {target_class}: {copied_count} images copied")

print("\nFinished mapping! You can now delete 'datasets/acne_raw' if you want to save space.")