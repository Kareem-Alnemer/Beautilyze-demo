import argparse
import os
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader
from torchvision import datasets, transforms, models
from pathlib import Path
from tqdm import tqdm

def get_data_loaders(dataset_dir, batch_size=32):
    train_transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.RandomHorizontalFlip(),
        transforms.RandomRotation(15),
        transforms.ColorJitter(brightness=0.1, contrast=0.1),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
    ])

    val_transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
    ])

    train_ds = datasets.ImageFolder(Path(dataset_dir) / "train", transform=train_transform)
    val_ds = datasets.ImageFolder(Path(dataset_dir) / "valid", transform=val_transform)

    train_loader = DataLoader(train_ds, batch_size=batch_size, shuffle=True, num_workers=2)
    val_loader = DataLoader(val_ds, batch_size=batch_size, shuffle=False, num_workers=2)

    return train_loader, val_loader, train_ds.classes

def build_model(num_classes, unfreeze=False):
    model = models.mobilenet_v3_small(weights=models.MobileNet_V3_Small_Weights.DEFAULT)
    
    # Freeze all initial parameters
    for param in model.parameters():
        param.requires_grad = False

    # Replace classifier head
    in_features = model.classifier[3].in_features
    model.classifier[3] = nn.Linear(in_features, num_classes)

    # Optionally unfreeze top backbone feature blocks (layers 9 to 12)
    if unfreeze:
        print("--> Unfreezing top backbone layers for fine-tuning...")
        for param in model.features[9:].parameters():
            param.requires_grad = True

    return model

def train_one_epoch(model, dataloader, criterion, optimizer, device):
    model.train()
    running_loss, correct, total = 0.0, 0, 0
    for inputs, labels in tqdm(dataloader, desc="Training", leave=False):
        inputs, labels = inputs.to(device), labels.to(device)
        optimizer.zero_grad()
        outputs = model(inputs)
        loss = criterion(outputs, labels)
        loss.backward()
        optimizer.step()

        running_loss += loss.item() * inputs.size(0)
        _, preds = outputs.max(1)
        correct += preds.eq(labels).sum().item()
        total += labels.size(0)

    return running_loss / total, correct / total

@torch.no_grad()
def evaluate(model, dataloader, criterion, device):
    model.eval()
    running_loss, correct, total = 0.0, 0, 0
    for inputs, labels in tqdm(dataloader, desc="Validating", leave=False):
        inputs, labels = inputs.to(device), labels.to(device)
        outputs = model(inputs)
        loss = criterion(outputs, labels)

        running_loss += loss.item() * inputs.size(0)
        _, preds = outputs.max(1)
        correct += preds.eq(labels).sum().item()
        total += labels.size(0)

    return running_loss / total, correct / total

def run(dataset_name, epochs=5, batch_size=32, lr=0.0001, unfreeze=False):
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Using device: {device}")

    dataset_path = Path("datasets") / dataset_name
    train_loader, val_loader, classes = get_data_loaders(dataset_path, batch_size)
    print(f"Dataset '{dataset_name}' classes: {classes}")

    # Calculate class weights to balance dataset imbalance
    train_ds = train_loader.dataset
    class_counts = [0] * len(classes)
    for _, label in train_ds.samples:
        class_counts[label] += 1
    
    total_samples = len(train_ds)
    weights = [total_samples / (len(classes) * count) for count in class_counts]
    class_weights = torch.tensor(weights, dtype=torch.float).to(device)
    print(f"Computed Class Weights: {weights}")

    model = build_model(len(classes), unfreeze=unfreeze).to(device)
    criterion = nn.CrossEntropyLoss(weight=class_weights)
    
    # Train all un-frozen parameters
    trainable_params = [p for p in model.parameters() if p.requires_grad]
    optimizer = optim.Adam(trainable_params, lr=lr)

    output_dir = Path("models")
    output_dir.mkdir(exist_ok=True)

    best_acc = 0.0
    for epoch in range(1, epochs + 1):
        train_loss, train_acc = train_one_epoch(model, train_loader, criterion, optimizer, device)
        val_loss, val_acc = evaluate(model, val_loader, criterion, device)

        print(f"Epoch {epoch:02d}/{epochs:02d} | Train Loss: {train_loss:.4f} Acc: {train_acc:.4f} | Val Loss: {val_loss:.4f} Acc: {val_acc:.4f}")

        if val_acc > best_acc:
            best_acc = val_acc
            save_path = output_dir / f"{dataset_name}_best.pt"
            torch.save({"model_state": model.state_dict(), "classes": classes}, save_path)
            print(f"  --> Saved new best model to {save_path} (Val Acc: {val_acc:.4f})")

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--dataset", type=str, required=True, choices=["skin_type", "acne"])
    parser.add_argument("--epochs", type=int, default=5)
    parser.add_argument("--lr", type=float, default=0.0001)
    parser.add_argument("--unfreeze", action="store_true", help="Unfreeze top backbone layers")
    args = parser.parse_args()

    run(args.dataset, epochs=args.epochs, lr=args.lr, unfreeze=args.unfreeze)