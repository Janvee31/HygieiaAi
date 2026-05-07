"""
Breast Cancer Image-Based Detection Model Training Script
Uses PyTorch with EfficientNet for breast cancer detection from mammography images
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
DATA_DIR = os.path.join(BASE_DIR, 'data', 'Breast Cancer')
CSV_DIR = os.path.join(DATA_DIR, 'csv')
JPEG_DIR = os.path.join(DATA_DIR, 'jpeg')
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

def resolve_image_path(row, jpeg_dir):
    """Resolve image path from CSV row"""
    try:
        # Extract patient ID from the image file path
        parts = row['image file path'].split('/')
        if len(parts) >= 2:
            patient_folder = parts[1]
            # Look for the patient folder in the JPEG directory
            patient_dir = os.path.join(jpeg_dir, patient_folder)
            if os.path.exists(patient_dir):
                # Get all JPEG images in this directory
                image_files = glob.glob(os.path.join(patient_dir, '*.jpg'))
                if image_files:
                    return image_files[0]  # Return the first image
    except:
        pass
    return None

def load_dataset(fast_mode=False):
    """Load and preprocess breast cancer dataset"""
    print("Loading and preprocessing breast cancer dataset...")
    
    # Load CSV files
    calc_csv_path = os.path.join(CSV_DIR, 'calc_case_description_train_set.csv')
    mass_csv_path = os.path.join(CSV_DIR, 'mass_case_description_train_set.csv')
    
    try:
        calc_df = pd.read_csv(calc_csv_path)
        mass_df = pd.read_csv(mass_csv_path)
        print(f"Loaded {len(calc_df)} calcification cases and {len(mass_df)} mass cases")
    except Exception as e:
        print(f"Error loading CSV files: {str(e)}")
        sys.exit(1)
    
    # Combine dataframes
    calc_df['abnormality_type'] = 'calcification'
    mass_df['abnormality_type'] = 'mass'
    combined_df = pd.concat([calc_df, mass_df], ignore_index=True)
    
    # Map pathology to binary labels (0: BENIGN, 1: MALIGNANT)
    combined_df['label'] = combined_df['pathology'].apply(
        lambda x: 1 if x == 'MALIGNANT' else 0
    )
    
    # Define class mapping
    class_mapping = {0: 'BENIGN', 1: 'MALIGNANT'}
    
    # Save class mapping
    with open(os.path.join(MODEL_DIR, 'breast_cancer_class_mapping.json'), 'w') as f:
        json.dump(class_mapping, f, indent=4)
    
    # Print class distribution
    print("Class distribution:")
    print(combined_df['pathology'].value_counts())
    
    # Apply path resolution
    combined_df['resolved_image_path'] = combined_df.apply(
        lambda row: resolve_image_path(row, JPEG_DIR), axis=1
    )
    
    # Filter out rows with missing image paths
    combined_df = combined_df.dropna(subset=['resolved_image_path'])
    print(f"After filtering missing images: {len(combined_df)} cases")
    
    # For fast mode, limit the number of samples
    if fast_mode:
        # Ensure balanced classes
        benign_samples = combined_df[combined_df['label'] == 0].sample(
            min(100, sum(combined_df['label'] == 0)), random_state=SEED
        )
        malignant_samples = combined_df[combined_df['label'] == 1].sample(
            min(100, sum(combined_df['label'] == 1)), random_state=SEED
        )
        combined_df = pd.concat([benign_samples, malignant_samples])
        print(f"Fast mode enabled: Using {len(combined_df)} samples")
    
    # Split into train, validation, and test sets
    from sklearn.model_selection import train_test_split
    
    train_df, temp_df = train_test_split(
        combined_df, test_size=0.3, random_state=SEED, stratify=combined_df['label']
    )
    
    val_df, test_df = train_test_split(
        temp_df, test_size=0.5, random_state=SEED, stratify=temp_df['label']
    )
    
    print(f"Train: {len(train_df)}, Validation: {len(val_df)}, Test: {len(test_df)}")
    
    # Get transforms
    train_transform, val_transform = get_transforms(input_size=224, augment=True)
    
    # Create datasets
    train_dataset = MedicalImageDataset(
        train_df['resolved_image_path'].tolist(),
        train_df['label'].tolist(),
        transform=train_transform
    )
    
    val_dataset = MedicalImageDataset(
        val_df['resolved_image_path'].tolist(),
        val_df['label'].tolist(),
        transform=val_transform
    )
    
    test_dataset = MedicalImageDataset(
        test_df['resolved_image_path'].tolist(),
        test_df['label'].tolist(),
        transform=val_transform
    )
    
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

def train_breast_cancer_model(fast_mode=False):
    """Train breast cancer detection model"""
    print("Starting breast cancer model training...")
    
    # Load dataset
    train_loader, val_loader, test_loader, class_mapping = load_dataset(fast_mode)
    
    # Create model
    model_name = 'efficientnet_b0' if not fast_mode else 'mobilenet_v2'
    model = create_model(model_name, num_classes=2)
    model = model.to(device)
    
    # Define loss function and optimizer
    criterion = nn.CrossEntropyLoss()
    optimizer = optim.Adam(model.parameters(), lr=0.001)
    scheduler = optim.lr_scheduler.ReduceLROnPlateau(
        optimizer, mode='min', factor=0.5, patience=3, min_lr=0.00001
    )
    
    # Set training parameters
    num_epochs = 5 if fast_mode else 15
    model_save_path = os.path.join(MODEL_DIR, 'breast_cancer_model.pth')
    
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
        model, 224, class_mapping, SAVED_MODEL_DIR, 'breast_cancer'
    )
    
    print(f"Breast cancer model training complete! Test accuracy: {test_acc:.4f}")
    return model, test_acc

def main():
    parser = argparse.ArgumentParser(description='Train breast cancer detection model')
    parser.add_argument('--fast', action='store_true', help='Use fast mode for hackathon demo')
    args = parser.parse_args()
    
    train_breast_cancer_model(fast_mode=args.fast)
    return 0

if __name__ == "__main__":
    sys.exit(main())