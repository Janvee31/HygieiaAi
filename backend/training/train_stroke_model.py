"""
Train a stroke prediction model
This script trains a machine learning model to predict stroke risk
"""

"""Train a stroke prediction model using synthetic data"""

import os
import sys
import pandas as pd
import numpy as np
import joblib
import argparse
from sklearn.ensemble import RandomForestClassifier
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.datasets import make_classification
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

def train_stroke_model(fast_mode=False):
    """Create a simple stroke prediction model using synthetic data"""
    print("Creating synthetic stroke dataset...")
    
    # Create synthetic data for stroke prediction
    # Features: gender, age, hypertension, heart_disease, ever_married, work_type, 
    # Residence_type, avg_glucose_level, bmi, smoking_status
    X, y = make_classification(
        n_samples=1000,
        n_features=10,  # 10 features
        n_informative=7,
        n_redundant=3,
        n_classes=2,
        random_state=42,
        weights=[0.85, 0.15]  # 15% positive class (stroke)
    )
    
    # Convert to DataFrame with appropriate column names
    feature_names = [
        'gender', 'age', 'hypertension', 'heart_disease', 'ever_married',
        'work_type', 'Residence_type', 'avg_glucose_level', 'bmi', 'smoking_status'
    ]
    X_df = pd.DataFrame(X, columns=feature_names)
    
    # Scale gender to 0, 1, 2 (Male, Female, Other)
    X_df['gender'] = np.floor((X_df['gender'] - X_df['gender'].min()) / 
                             (X_df['gender'].max() - X_df['gender'].min()) * 2.99).astype(int)
    
    # Scale age to realistic values (20-85)
    X_df['age'] = (X_df['age'] - X_df['age'].min()) / (X_df['age'].max() - X_df['age'].min()) * 65 + 20
    
    # Convert binary features to 0 or 1
    binary_features = ['hypertension', 'heart_disease', 'ever_married']
    for col in binary_features:
        X_df[col] = (X_df[col] > 0).astype(int)
    
    # Scale work_type to 0-4 (Private, Self-employed, Govt_job, children, Never_worked)
    X_df['work_type'] = np.floor((X_df['work_type'] - X_df['work_type'].min()) / 
                               (X_df['work_type'].max() - X_df['work_type'].min()) * 4.99).astype(int)
    
    # Scale Residence_type to 0-1 (Rural, Urban)
    X_df['Residence_type'] = (X_df['Residence_type'] > 0).astype(int)
    
    # Scale avg_glucose_level to realistic values (70-300)
    X_df['avg_glucose_level'] = (X_df['avg_glucose_level'] - X_df['avg_glucose_level'].min()) / \
                              (X_df['avg_glucose_level'].max() - X_df['avg_glucose_level'].min()) * 230 + 70
    
    # Scale bmi to realistic values (18-40)
    X_df['bmi'] = (X_df['bmi'] - X_df['bmi'].min()) / (X_df['bmi'].max() - X_df['bmi'].min()) * 22 + 18
    
    # Scale smoking_status to 0-3 (never smoked, formerly smoked, smokes, Unknown)
    X_df['smoking_status'] = np.floor((X_df['smoking_status'] - X_df['smoking_status'].min()) / \
                                   (X_df['smoking_status'].max() - X_df['smoking_status'].min()) * 3.99).astype(int)
    
    # Print dataset information
    print(f"Created synthetic dataset with {len(X_df)} samples")
    print(f"Feature columns: {X_df.columns.tolist()}")
    print(f"Target distribution: {pd.Series(y).value_counts()}")
    
    # Split into train and test sets
    X_train, X_test, y_train, y_test = train_test_split(
        X_df, y, test_size=0.2, random_state=42, stratify=y
    )
    
    # If fast mode is enabled, use a smaller subset of the data
    if fast_mode:
        print("Fast mode enabled, using subset of data...")
        # Use only 20% of training data for faster training
        X_train, _, y_train, _ = train_test_split(
            X_train, y_train, test_size=0.8, random_state=42, stratify=y_train
        )
    
    print(f"Training data shape: {X_train.shape}")
    
    # Create a pipeline with preprocessing and model
    pipeline = Pipeline([
        ('scaler', StandardScaler()),
        ('classifier', RandomForestClassifier(
            n_estimators=50,  # Reduced for faster training
            max_depth=8,
            random_state=42,
            n_jobs=-1,
            class_weight='balanced'  # Handle class imbalance
        ))
    ])
    
    # Train the model
    print("Training model...")
    pipeline.fit(X_train, y_train)
    
    # Evaluate the model
    print("Evaluating model...")
    y_pred = pipeline.predict(X_test)
    accuracy = accuracy_score(y_test, y_pred)
    print(f"Accuracy: {accuracy:.4f}")
    print("Classification Report:")
    print(classification_report(y_test, y_pred))
    
    # Save the model
    print("Saving model...")
    model_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'saved_models')
    os.makedirs(model_dir, exist_ok=True)
    model_path = os.path.join(model_dir, 'stroke_model.pkl')
    joblib.dump(pipeline, model_path)
    print(f"Model saved to {model_path}")
    
    # Save feature names for reference
    feature_names = X_df.columns.tolist()
    with open(os.path.join(model_dir, 'stroke_features.txt'), 'w') as f:
        f.write('\n'.join(feature_names))
    
    return pipeline

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Train stroke prediction model')
    parser.add_argument('--fast', action='store_true', help='Use fast mode with reduced dataset')
    args = parser.parse_args()
    
    train_stroke_model(args.fast)
