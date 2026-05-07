"""
Skin Cancer Detection Model Training Script
Uses PyTorch with MobileNetV2 for skin cancer classification
Optimized for hackathon demonstration on i7 13th gen with RTX 4050
"""

import os
import sys
import argparse
import pandas as pd
import numpy as np
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import Dataset, DataLoader
import glob
from PIL import Image
import time
import json
from tqdm import tqdm

# Import utility functions
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from training.image_model_utils import (
    MedicalImageDataset, get_transforms, create_model, 
    train_model, evaluate_model, plot_training_history,
    save_model_for_inference, device
)

# Set paths
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, 'data', 'Skin Cancer')
MODEL_DIR = os.path.join(BASE_DIR, 'models')
SAVED_MODEL_DIR = os.path.join(BASE_DIR, 'saved_models')

# Create directories if they don't exist
os.makedirs(MODEL_DIR, exist_ok=True)
os.makedirs(SAVED_MODEL_DIR, exist_ok=True)

# Set random seed for reproducibility
SEED = 42
torch.manual_seed(SEED)
np.random.seed(SEED)
if torch.cuda.is_available():
    torch.cuda.manual_seed(SEED)

def load_dataset(fast_mode=False):
    """Load and preprocess skin cancer dataset"""
    print("Loading and preprocessing skin cancer dataset...")
    
    # Define class mapping based on common skin cancer datasets
    class_mapping = {
        0: 'Melanoma',
        1: 'Nevus',
        2: 'Basal Cell Carcinoma',
        3: 'Actinic Keratosis',
        4: 'Benign Keratosis',
        5: 'Dermatofibroma',
        6: 'Vascular Lesion'
    }
    
    # Save class mapping
    with open(os.path.join(MODEL_DIR, 'skin_cancer_class_mapping.json'), 'w') as f:
        json.dump(class_mapping, f, indent=4)
    
    # Get all image directories
    image_dirs = []
    for class_idx, class_name in class_mapping.items():
        class_dir = os.path.join(DATA_DIR, class_name.replace(' ', '_'))
        if os.path.exists(class_dir):
            image_dirs.append((class_dir, class_idx))
    
    if not image_dirs:
        print(f"Error: No image directories found in {DATA_DIR}")
        print("Please organize skin cancer images in class-specific directories")
        sys.exit(1)
    
    # Collect image paths and labels
    all_image_paths = []
    all_labels = []
    
    for dir_path, class_idx in image_dirs:
        image_files = []
        for ext in ['*.jpg', '*.jpeg', '*.png']:
            image_files.extend(glob.glob(os.path.join(dir_path, ext)))
        
        print(f"Found {len(image_files)} images in {os.path.basename(dir_path)}")
        
        if fast_mode and len(image_files) > 100:
            # Limit to 100 images per class in fast mode
            np.random.shuffle(image_files)
            image_files = image_files[:100]
        
        all_image_paths.extend(image_files)
        all_labels.extend([class_idx] * len(image_files))
    
    # Split into train, validation, and test sets
    from sklearn.model_selection import train_test_split
    
    X_train, X_temp, y_train, y_temp = train_test_split(
        all_image_paths, all_labels, test_size=0.3, random_state=SEED, stratify=all_labels
    )
    
    X_val, X_test, y_val, y_test = train_test_split(
        X_temp, y_temp, test_size=0.5, random_state=SEED, stratify=y_temp
    )
    
    print(f"Train: {len(X_train)}, Validation: {len(X_val)}, Test: {len(X_test)}")
    
    # Get transforms with skin-specific augmentations
    train_transform, val_transform = get_transforms(input_size=224, augment=True)
    
    # Create datasets
    train_dataset = MedicalImageDataset(X_train, y_train, transform=train_transform)
    val_dataset = MedicalImageDataset(X_val, y_val, transform=val_transform)
    test_dataset = MedicalImageDataset(X_test, y_test, transform=val_transform)
    
    # Create data loaders
    batch_size = 32 if fast_mode else 64
    
    train_loader = DataLoader(
        train_dataset, batch_size=batch_size, shuffle=True, 
        num_workers=4, pin_memory=True
    )
    
    val_loader = DataLoader(
        val_dataset, batch_size=batch_size, shuffle=False, 
        num_workers=4, pin_memory=True
    )
    
    test_loader = DataLoader(
        test_dataset, batch_size=batch_size, shuffle=False, 
        num_workers=4, pin_memory=True
    )
    
    return train_loader, val_loader, test_loader, class_mapping

def train_skin_cancer_model(fast_mode=False):
    """Train skin cancer detection model"""
    print("Starting skin cancer model training...")
    
    # Load dataset
    train_loader, val_loader, test_loader, class_mapping = load_dataset(fast_mode)
    
    # Create model - MobileNetV2 is faster for training
    model_name = 'mobilenet_v2'
    model = create_model(model_name, num_classes=len(class_mapping))
    model = model.to(device)
    
    # Define loss function and optimizer
    criterion = nn.CrossEntropyLoss()
    optimizer = optim.Adam(model.parameters(), lr=0.001)
    scheduler = optim.lr_scheduler.ReduceLROnPlateau(
        optimizer, mode='min', factor=0.5, patience=3, min_lr=0.00001
    )
    
    # Set training parameters
    num_epochs = 5 if fast_mode else 15
    model_save_path = os.path.join(MODEL_DIR, 'skin_cancer_model.pth')
    
    # Train model
    model, history = train_model(
        model, train_loader, val_loader, criterion, optimizer, scheduler,
        device, num_epochs=num_epochs, model_save_path=model_save_path,
        early_stopping_patience=5, use_mixed_precision=True
    )
    
    # Plot training history
    plot_training_history(history, MODEL_DIR)
    
    # Evaluate model
    class_names = list(class_mapping.values())
    test_acc, report = evaluate_model(
        model, test_loader, criterion, device, class_names, MODEL_DIR
    )
    
    # Save model for inference
    save_model_for_inference(
        model, 224, class_mapping, SAVED_MODEL_DIR, 'skin_cancer'
    )
    
    print(f"Skin cancer model training complete! Test accuracy: {test_acc:.4f}")
    return model, test_acc

def main():
    parser = argparse.ArgumentParser(description='Train skin cancer detection model')
    parser.add_argument('--fast', action='store_true', help='Use fast mode for hackathon demo')
    args = parser.parse_args()
    
    train_skin_cancer_model(fast_mode=args.fast)
    return 0

if __name__ == "__main__":
    sys.exit(main())