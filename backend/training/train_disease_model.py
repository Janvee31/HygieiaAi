"""
Disease Prediction Model Training Script
Uses XGBoost classifier to predict diseases based on symptoms
"""

import pandas as pd
import numpy as np
import os
import xgboost as xgb
from sklearn.model_selection import train_test_split, GridSearchCV
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
from sklearn.preprocessing import LabelEncoder
import matplotlib.pyplot as plt
import seaborn as sns
import joblib

# Set paths
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, 'data')
MODEL_DIR = os.path.join(BASE_DIR, 'models')

# Print paths for debugging
print(f"Base directory: {BASE_DIR}")
print(f"Data directory: {DATA_DIR}")
print(f"Model directory: {MODEL_DIR}")

# Create model directory if it doesn't exist
os.makedirs(MODEL_DIR, exist_ok=True)

def load_and_prepare_data():
    """Load and prepare the dataset for training"""
    print("Loading disease dataset...")
    
    # Load the dataset
    df = pd.read_csv(os.path.join(DATA_DIR, 'clean_dataset.tsv'), sep='\t')
    
    print(f"Dataset shape: {df.shape}")
    print(f"Columns: {df.columns.tolist()[:5]}... (total: {len(df.columns)})")
    
    # Extract features (X) and target (y)
    X = df.drop('Disease', axis=1)
    y = df['Disease']
    
    # Encode the target variable
    le = LabelEncoder()
    y_encoded = le.fit_transform(y)
    
    # Save the label encoder for later use
    joblib.dump(le, os.path.join(MODEL_DIR, 'disease_label_encoder.pkl'))
    
    # Split the data into training and testing sets
    X_train, X_test, y_train, y_test = train_test_split(
        X, y_encoded, test_size=0.2, random_state=42
    )
    
    print(f"Training set shape: {X_train.shape}")
    print(f"Testing set shape: {X_test.shape}")
    
    return X_train, X_test, y_train, y_test, le

def train_model(X_train, y_train):
    """Train the XGBoost model with hyperparameter tuning"""
    print("Training XGBoost model...")
    
    # Define the parameter grid for GridSearchCV
    param_grid = {
        'max_depth': [3, 5, 7],
        'learning_rate': [0.1, 0.01],
        'n_estimators': [100, 200],
        'subsample': [0.8, 1.0],
        'colsample_bytree': [0.8, 1.0]
    }
    
    # Initialize the XGBoost classifier
    xgb_model = xgb.XGBClassifier(
        objective='multi:softprob',
        random_state=42,
        use_label_encoder=False,
        eval_metric='mlogloss'
    )
    
    # Perform grid search with cross-validation
    grid_search = GridSearchCV(
        estimator=xgb_model,
        param_grid=param_grid,
        cv=5,
        scoring='accuracy',
        verbose=1,
        n_jobs=-1
    )
    
    # Fit the grid search to the data
    grid_search.fit(X_train, y_train)
    
    # Get the best model
    best_model = grid_search.best_estimator_
    print(f"Best parameters: {grid_search.best_params_}")
    
    return best_model

def evaluate_model(model, X_test, y_test, le):
    """Evaluate the trained model"""
    print("Evaluating model performance...")
    
    # Make predictions
    y_pred = model.predict(X_test)
    
    # Calculate accuracy
    accuracy = accuracy_score(y_test, y_pred)
    print(f"Accuracy: {accuracy:.4f}")
    
    # Generate classification report
    class_names = le.classes_
    report = classification_report(y_test, y_pred, target_names=class_names)
    print("Classification Report:")
    print(report)
    
    # Plot confusion matrix
    plt.figure(figsize=(12, 10))
    cm = confusion_matrix(y_test, y_pred)
    sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', xticklabels=class_names, yticklabels=class_names)
    plt.title('Confusion Matrix')
    plt.ylabel('True Label')
    plt.xlabel('Predicted Label')
    plt.xticks(rotation=90)
    plt.yticks(rotation=0)
    plt.tight_layout()
    plt.savefig(os.path.join(MODEL_DIR, 'disease_confusion_matrix.png'))
    
    # Feature importance
    plt.figure(figsize=(12, 8))
    xgb.plot_importance(model, max_num_features=20)
    plt.title('Top 20 Feature Importances')
    plt.tight_layout()
    plt.savefig(os.path.join(MODEL_DIR, 'disease_feature_importance.png'))
    
    return accuracy

def save_model(model):
    """Save the trained model"""
    print("Saving model...")
    
    # Save the model
    model_path = os.path.join(MODEL_DIR, 'disease_prediction_model.json')
    model.save_model(model_path)
    print(f"Model saved to {model_path}")

def main():
    """Main function to train and evaluate the model"""
    print("Starting disease prediction model training...")
    
    # Load and prepare data
    X_train, X_test, y_train, y_test, le = load_and_prepare_data()
    
    # Train the model
    model = train_model(X_train, y_train)
    
    # Evaluate the model
    evaluate_model(model, X_test, y_test, le)
    
    # Save the model
    save_model(model)
    
    print("Disease prediction model training completed!")

if __name__ == "__main__":
    main()
