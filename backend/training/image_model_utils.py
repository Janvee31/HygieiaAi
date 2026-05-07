"""
Utility functions for image-based medical models
Shared across breast cancer, skin cancer, and brain tumor models
"""

import os
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import torch
import torch.nn as nn
from torch.utils.data import Dataset, DataLoader
import torchvision.transforms as transforms
from torchvision import models
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, confusion_matrix, roc_curve, auc
import cv2
from PIL import Image
import time
import json
from tqdm import tqdm

# Set device for PyTorch
device = torch.device("cuda:0" if torch.cuda.is_available() else "cpu")
print(f"Using device: {device}")

class MedicalImageDataset(Dataset):
    """Generic dataset for medical images"""
    
    def __init__(self, image_paths, labels, transform=None):
        self.image_paths = image_paths
        self.labels = labels
        self.transform = transform
    
    def __len__(self):
        return len(self.image_paths)
    
    def __getitem__(self, idx):
        img_path = self.image_paths[idx]
        label = self.labels[idx]
        
        try:
            # Try to load with PIL first
            image = Image.open(img_path).convert('RGB')
        except:
            # Fallback to OpenCV
            image = cv2.imread(img_path)
            image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
            image = Image.fromarray(image)
        
        if self.transform:
            image = self.transform(image)
            
        return image, label

def get_transforms(input_size=224, augment=True):
    """Get image transformations for training and validation"""
    
    # Training transforms with augmentation
    if augment:
        train_transform = transforms.Compose([
            transforms.Resize((input_size, input_size)),
            transforms.RandomHorizontalFlip(),
            transforms.RandomRotation(10),
            transforms.ColorJitter(brightness=0.1, contrast=0.1),
            transforms.ToTensor(),
            transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
        ])
    else:
        train_transform = transforms.Compose([
            transforms.Resize((input_size, input_size)),
            transforms.ToTensor(),
            transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
        ])
    
    # Validation transforms (no augmentation)
    val_transform = transforms.Compose([
        transforms.Resize((input_size, input_size)),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
    ])
    
    return train_transform, val_transform

def create_model(model_name, num_classes, pretrained=True):
    """Create a model with pretrained weights"""
    
    if model_name == 'resnet18':
        model = models.resnet18(pretrained=pretrained)
        num_ftrs = model.fc.in_features
        model.fc = nn.Linear(num_ftrs, num_classes)
    
    elif model_name == 'resnet50':
        model = models.resnet50(pretrained=pretrained)
        num_ftrs = model.fc.in_features
        model.fc = nn.Linear(num_ftrs, num_classes)
    
    elif model_name == 'efficientnet_b0':
        model = models.efficientnet_b0(pretrained=pretrained)
        num_ftrs = model.classifier[1].in_features
        model.classifier[1] = nn.Linear(num_ftrs, num_classes)
    
    elif model_name == 'mobilenet_v2':
        model = models.mobilenet_v2(pretrained=pretrained)
        num_ftrs = model.classifier[1].in_features
        model.classifier[1] = nn.Linear(num_ftrs, num_classes)
    
    else:
        raise ValueError(f"Unsupported model: {model_name}")
    
    return model

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
    with open(os.path.join(output_dir, 'classification_report.json'), 'w') as f:
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
    plt.savefig(os.path.join(output_dir, 'confusion_matrix.png'))
    
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
        plt.savefig(os.path.join(output_dir, 'roc_curve.png'))
    
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
    plt.savefig(os.path.join(output_dir, 'training_history.png'))
    
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
