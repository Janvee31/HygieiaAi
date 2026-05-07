"""
Breast Cancer Image-Based Detection Model Training Script
Uses PyTorch with transfer learning for breast cancer detection from mammography images
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
import torchvision.transforms as transforms
from torchvision import models
import glob
from PIL import Image
import time
import json
from tqdm import tqdm
import matplotlib.pyplot as plt
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, confusion_matrix, roc_curve, auc

# Set device
device = torch.device("cuda:0" if torch.cuda.is_available() else "cpu")
print(f"Using device: {device}")

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

class DdsmDataset(Dataset):
    """DDSM Mammography Dataset"""
    
    def __init__(self, dataframe, jpeg_dir, transform=None):
        self.dataframe = dataframe
        self.jpeg_dir = jpeg_dir
        self.transform = transform
        
        # Extract patient IDs from image file paths
        self.dataframe['patient_id'] = self.dataframe['image file path'].apply(self.extract_patient_id)
        
        # Filter out rows with missing patient IDs
        self.dataframe = self.dataframe.dropna(subset=['patient_id'])
        
    def extract_patient_id(self, path):
        """Extract patient ID from image file path"""
        if pd.isna(path):
            return None
        
        parts = path.split('/')
        if len(parts) >= 2:
            return parts[1]
        return None
    
    def __len__(self):
        return len(self.dataframe)
    
    def __getitem__(self, idx):
        row = self.dataframe.iloc[idx]
        patient_id = row['patient_id']
        label = row['label']
        
        # Find image in JPEG directory
        patient_dir = os.path.join(self.jpeg_dir, patient_id)
        if os.path.exists(patient_dir):
            image_files = glob.glob(os.path.join(patient_dir, '*.jpg'))
            if image_files:
                try:
                    img = Image.open(image_files[0]).convert('RGB')
                    if self.transform:
                        img = self.transform(img)
                    return img, label
                except Exception as e:
                    print(f"Error loading image {image_files[0]}: {str(e)}")
        
        # Return a default image if the actual image can't be loaded
        return torch.zeros((3, 224, 224)), label

def load_dataset(fast_mode=False):
    """Load and preprocess breast cancer dataset"""
    print("Loading and preprocessing breast cancer dataset...")
    
    # Load CSV files
    try:
        calc_df = pd.read_csv(os.path.join(CSV_DIR, 'calc_case_description_train_set.csv'))
        mass_df = pd.read_csv(os.path.join(CSV_DIR, 'mass_case_description_train_set.csv'))
        print(f"Loaded {len(calc_df)} calcification cases and {len(mass_df)} mass cases")
    except Exception as e:
        print(f"Error loading CSV files: {str(e)}")
        sys.exit(1)
    
    # Create binary labels
    calc_df['label'] = calc_df['pathology'].apply(lambda x: 1 if x == 'MALIGNANT' else 0)
    mass_df['label'] = mass_df['pathology'].apply(lambda x: 1 if x == 'MALIGNANT' else 0)
    
    # Combine dataframes
    combined_df = pd.concat([calc_df, mass_df], ignore_index=True)
    
    # Print class distribution
    print("Class distribution:")
    print(combined_df['pathology'].value_counts())
    
    # Define class mapping
    class_mapping = {0: 'BENIGN', 1: 'MALIGNANT'}
    
    # Save class mapping
    with open(os.path.join(MODEL_DIR, 'breast_cancer_class_mapping.json'), 'w') as f:
        json.dump(class_mapping, f, indent=4)
    
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
    train_df, temp_df = train_test_split(
        combined_df, test_size=0.3, random_state=SEED, stratify=combined_df['label']
    )
    
    val_df, test_df = train_test_split(
        temp_df, test_size=0.5, random_state=SEED, stratify=temp_df['label']
    )
    
    print(f"Train: {len(train_df)}, Validation: {len(val_df)}, Test: {len(test_df)}")
    
    # Define transformations
    train_transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.RandomHorizontalFlip(),
        transforms.RandomRotation(10),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
    ])
    
    val_transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(), 
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
    ])
    
    # Create datasets
    train_dataset = DdsmDataset(train_df, JPEG_DIR, transform=train_transform)
    val_dataset = DdsmDataset(val_df, JPEG_DIR, transform=val_transform)
    test_dataset = DdsmDataset(test_df, JPEG_DIR, transform=val_transform)
    
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

def train_epoch(model, dataloader, criterion, optimizer, device, scaler=None):
    """Train for one epoch"""
    model.train()
    running_loss = 0.0
    running_corrects = 0
    
    for inputs, labels in tqdm(dataloader, desc="Training"):
        inputs = inputs.to(device)
        labels = labels.to(device)
        
        # Zero the parameter gradients
        optimizer.zero_grad()
        
        # Forward pass with or without mixed precision
        if scaler:
            with torch.cuda.amp.autocast():
                outputs = model(inputs)
                loss = criterion(outputs, labels)
            
            # Backward and optimize with gradient scaling
            scaler.scale(loss).backward()
            scaler.step(optimizer)
            scaler.update()
        else:
            outputs = model(inputs)
            loss = criterion(outputs, labels)
            loss.backward()
            optimizer.step()
        
        # Statistics
        _, preds = torch.max(outputs, 1)
        running_loss += loss.item() * inputs.size(0)
        running_corrects += torch.sum(preds == labels.data)
    
    epoch_loss = running_loss / len(dataloader.dataset)
    epoch_acc = running_corrects.double() / len(dataloader.dataset)
    
    return epoch_loss, epoch_acc.item()

def validate_epoch(model, dataloader, criterion, device):
    """Validate the model"""
    model.eval()
    running_loss = 0.0
    running_corrects = 0
    
    all_labels = []
    all_preds = []
    all_probs = []
    
    with torch.no_grad():
        for inputs, labels in tqdm(dataloader, desc="Validation"):
            inputs = inputs.to(device)
            labels = labels.to(device)
            
            outputs = model(inputs)
            loss = criterion(outputs, labels)
            
            probs = torch.nn.functional.softmax(outputs, dim=1)
            _, preds = torch.max(outputs, 1)
            
            running_loss += loss.item() * inputs.size(0)
            running_corrects += torch.sum(preds == labels.data)
            
            all_labels.extend(labels.cpu().numpy())
            all_preds.extend(preds.cpu().numpy())
            all_probs.extend(probs.cpu().numpy())
    
    epoch_loss = running_loss / len(dataloader.dataset)
    epoch_acc = running_corrects.double() / len(dataloader.dataset)
    
    return epoch_loss, epoch_acc.item(), all_labels, all_preds, all_probs

def train_model(model, train_loader, val_loader, criterion, optimizer, 
                scheduler, device, num_epochs=10, model_save_path=None, 
                early_stopping_patience=5, use_mixed_precision=True):
    """Train the model with validation and early stopping"""
    
    since = time.time()
    
    best_model_wts = model.state_dict()
    best_acc = 0.0
    
    history = {
        'train_loss': [],
        'train_acc': [],
        'val_loss': [],
        'val_acc': []
    }
    
    # For early stopping
    no_improve_epochs = 0
    
    # For mixed precision training
    scaler = torch.cuda.amp.GradScaler() if use_mixed_precision and device.type == 'cuda' else None
    
    for epoch in range(num_epochs):
        print(f'Epoch {epoch+1}/{num_epochs}')
        print('-' * 10)
        
        # Train phase
        train_loss, train_acc = train_epoch(model, train_loader, criterion, optimizer, device, scaler)
        
        print(f'Train Loss: {train_loss:.4f} Acc: {train_acc:.4f}')
        
        # Validation phase
        val_loss, val_acc, _, _, _ = validate_epoch(model, val_loader, criterion, device)
        
        print(f'Val Loss: {val_loss:.4f} Acc: {val_acc:.4f}')
        
        # Update learning rate
        if scheduler:
            scheduler.step(val_loss)
        
        # Save history
        history['train_loss'].append(train_loss)
        history['train_acc'].append(train_acc)
        history['val_loss'].append(val_loss)
        history['val_acc'].append(val_acc)
        
        # Deep copy the model if it's the best
        if val_acc > best_acc:
            best_acc = val_acc
            best_model_wts = model.state_dict().copy()
            no_improve_epochs = 0
            
            # Save the best model
            if model_save_path:
                torch.save(best_model_wts, model_save_path)
                print(f"Saved best model to {model_save_path}")
        else:
            no_improve_epochs += 1
        
        # Early stopping
        if no_improve_epochs >= early_stopping_patience:
            print(f"Early stopping at epoch {epoch+1}")
            break
        
        print()
    
    time_elapsed = time.time() - since
    print(f'Training complete in {time_elapsed // 60:.0f}m {time_elapsed % 60:.0f}s')
    print(f'Best val Acc: {best_acc:.4f}')
    
    # Load best model weights
    model.load_state_dict(best_model_wts)
    
    return model, history

def evaluate_model(model, test_loader, criterion, device, class_names, output_dir):
    """Evaluate the model and save visualizations"""
    
    # Evaluate
    test_loss, test_acc, all_labels, all_preds, all_probs = validate_epoch(
        model, test_loader, criterion, device
    )
    
    print(f'Test Loss: {test_loss:.4f} Acc: {test_acc:.4f}')
    
    # Classification report
    report = classification_report(all_labels, all_preds, target_names=class_names, output_dict=True)
    print(classification_report(all_labels, all_preds, target_names=class_names))
    
    # Save report as JSON
    with open(os.path.join(output_dir, 'breast_cancer_classification_report.json'), 'w') as f:
        json.dump(report, f, indent=4)
    
    # Confusion matrix
    cm = confusion_matrix(all_labels, all_preds)
    plt.figure(figsize=(10, 8))
    plt.imshow(cm, interpolation='nearest', cmap=plt.cm.Blues)
    plt.title('Confusion Matrix')
    plt.colorbar()
    tick_marks = np.arange(len(class_names))
    plt.xticks(tick_marks, class_names, rotation=45)
    plt.yticks(tick_marks, class_names)
    
    # Add text annotations
    thresh = cm.max() / 2
    for i in range(cm.shape[0]):
        for j in range(cm.shape[1]):
            plt.text(j, i, format(cm[i, j], 'd'),
                    horizontalalignment="center",
                    color="white" if cm[i, j] > thresh else "black")
    
    plt.tight_layout()
    plt.ylabel('True label')
    plt.xlabel('Predicted label')
    plt.savefig(os.path.join(output_dir, 'breast_cancer_confusion_matrix.png'))
    
    # ROC curve for binary classification
    if len(class_names) == 2:
        fpr, tpr, _ = roc_curve(all_labels, [probs[1] for probs in all_probs])
        roc_auc = auc(fpr, tpr)
        
        plt.figure(figsize=(8, 6))
        plt.plot(fpr, tpr, color='darkorange', lw=2, label=f'ROC curve (area = {roc_auc:.2f})')
        plt.plot([0, 1], [0, 1], color='navy', lw=2, linestyle='--')
        plt.xlim([0.0, 1.0])
        plt.ylim([0.0, 1.05])
        plt.xlabel('False Positive Rate')
        plt.ylabel('True Positive Rate')
        plt.title('Receiver Operating Characteristic')
        plt.legend(loc="lower right")
        plt.savefig(os.path.join(output_dir, 'breast_cancer_roc_curve.png'))
    
    return test_acc, report

def plot_training_history(history, output_dir):
    """Plot training history"""
    
    plt.figure(figsize=(12, 4))
    
    plt.subplot(1, 2, 1)
    plt.plot(history['train_acc'], label='Training Accuracy')
    plt.plot(history['val_acc'], label='Validation Accuracy')
    plt.title('Accuracy')
    plt.xlabel('Epoch')
    plt.ylabel('Accuracy')
    plt.legend()
    
    plt.subplot(1, 2, 2)
    plt.plot(history['train_loss'], label='Training Loss')
    plt.plot(history['val_loss'], label='Validation Loss')
    plt.title('Loss')
    plt.xlabel('Epoch')
    plt.ylabel('Loss')
    plt.legend()
    
    plt.tight_layout()
    plt.savefig(os.path.join(output_dir, 'breast_cancer_training_history.png'))
    
def save_model_for_inference(model, input_size, class_mapping, output_dir, model_name):
    """Save model for inference in multiple formats"""
    
    # Save PyTorch model
    torch.save(model.state_dict(), os.path.join(output_dir, f'{model_name}.pth'))
    
    # Save entire model
    torch.save(model, os.path.join(output_dir, f'{model_name}_full.pth'))
    
    # Save class mapping
    with open(os.path.join(output_dir, f'{model_name}_classes.json'), 'w') as f:
        json.dump(class_mapping, f, indent=4)
    
    # Save model info
    model_info = {
        'input_size': input_size,
        'num_classes': len(class_mapping),
        'class_names': list(class_mapping.values()),
        'date_trained': time.strftime("%Y-%m-%d %H:%M:%S")
    }
    
    with open(os.path.join(output_dir, f'{model_name}_info.json'), 'w') as f:
        json.dump(model_info, f, indent=4)
    
    # Export to ONNX format
    try:
        dummy_input = torch.randn(1, 3, input_size, input_size).to(device)
        torch.onnx.export(
            model,
            dummy_input,
            os.path.join(output_dir, f'{model_name}.onnx'),
            export_params=True,
            opset_version=11,
            do_constant_folding=True,
            input_names=['input'],
            output_names=['output'],
            dynamic_axes={'input': {0: 'batch_size'}, 'output': {0: 'batch_size'}}
        )
        print(f"Model exported to ONNX format: {os.path.join(output_dir, f'{model_name}.onnx')}")
    except Exception as e:
        print(f"Error exporting to ONNX: {str(e)}")

def train_breast_cancer_model(fast_mode=False):
    """Train breast cancer detection model"""
    print("Starting breast cancer model training...")
    
    # Load dataset
    train_loader, val_loader, test_loader, class_mapping = load_dataset(fast_mode)
    
    # Create model - ResNet18 is good for medical images and trains quickly
    model = models.resnet18(pretrained=True)
    num_ftrs = model.fc.in_features
    model.fc = nn.Linear(num_ftrs, 2)  # Binary classification
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
