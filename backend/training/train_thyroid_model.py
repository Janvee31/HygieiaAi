"""
Train a thyroid disease prediction model
This script creates a simple thyroid disease prediction model
"""

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

def train_thyroid_model(fast_mode=False):
    """Create a simple thyroid disease prediction model using synthetic data"""
    print("Creating synthetic thyroid dataset...")
    
    # Create synthetic data for thyroid prediction with all the required features
    # Features must match exactly what's used in the prediction endpoint
    X, y = make_classification(
        n_samples=1000,
        n_features=21,  # All 21 features needed
        n_informative=7,
        n_redundant=14,
        n_classes=2,
        random_state=42,
        weights=[0.8, 0.2]  # 20% positive class (hypothyroid)
    )
    
    # Convert to DataFrame with appropriate column names - MUST match prediction endpoint
    feature_names = [
        'age', 'sex', 'TSH', 'T3', 'TT4', 'T4U', 'FTI',
        'on_thyroxine', 'query_on_thyroxine', 'on_antithyroid_medication',
        'sick', 'pregnant', 'thyroid_surgery', 'I131_treatment',
        'query_hypothyroid', 'query_hyperthyroid', 'lithium',
        'goitre', 'tumor', 'hypopituitary', 'psych'
    ]
    X_df = pd.DataFrame(X, columns=feature_names)
    
    # Scale age to realistic values (20-80)
    X_df['age'] = (X_df['age'] - X_df['age'].min()) / (X_df['age'].max() - X_df['age'].min()) * 60 + 20
    
    # Convert sex to binary (0 or 1)
    X_df['sex'] = (X_df['sex'] > 0).astype(int)
    
    # Scale TSH to realistic values (0.1-10)
    X_df['TSH'] = (X_df['TSH'] - X_df['TSH'].min()) / (X_df['TSH'].max() - X_df['TSH'].min()) * 9.9 + 0.1
    
    # Scale T3 to realistic values (80-220)
    X_df['T3'] = (X_df['T3'] - X_df['T3'].min()) / (X_df['T3'].max() - X_df['T3'].min()) * 140 + 80
    
    # Scale TT4 to realistic values (4-12)
    X_df['TT4'] = (X_df['TT4'] - X_df['TT4'].min()) / (X_df['TT4'].max() - X_df['TT4'].min()) * 8 + 4
    
    # Scale T4U to realistic values (0.8-1.8)
    X_df['T4U'] = (X_df['T4U'] - X_df['T4U'].min()) / (X_df['T4U'].max() - X_df['T4U'].min()) * 1 + 0.8
    
    # Scale FTI to realistic values (80-180)
    X_df['FTI'] = (X_df['FTI'] - X_df['FTI'].min()) / (X_df['FTI'].max() - X_df['FTI'].min()) * 100 + 80
    
    # Convert all binary features to 0 or 1
    binary_features = [
        'on_thyroxine', 'query_on_thyroxine', 'on_antithyroid_medication',
        'sick', 'pregnant', 'thyroid_surgery', 'I131_treatment',
        'query_hypothyroid', 'query_hyperthyroid', 'lithium',
        'goitre', 'tumor', 'hypopituitary', 'psych'
    ]
    
    for col in binary_features:
        X_df[col] = (X_df[col] > 0).astype(int)
    
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
    model_path = os.path.join(model_dir, 'thyroid_model.pkl')
    joblib.dump(pipeline, model_path)
    print(f"Model saved to {model_path}")
    
    # Save feature names for reference
    feature_names = X_df.columns.tolist()
    with open(os.path.join(model_dir, 'thyroid_features.txt'), 'w') as f:
        f.write('\n'.join(feature_names))
    
    # No need to save target mapping as we're using binary classification
    
    return pipeline

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Train thyroid disease prediction model')
    parser.add_argument('--fast', action='store_true', help='Use fast mode with reduced dataset')
    args = parser.parse_args()
    
    train_thyroid_model(args.fast)
