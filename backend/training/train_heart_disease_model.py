"""
Heart Disease Prediction Model Training Script
Uses Random Forest and Gradient Boosting to predict heart disease
"""

import pandas as pd
import numpy as np
import os
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.model_selection import train_test_split, GridSearchCV, cross_val_score
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix, roc_curve, auc
from sklearn.pipeline import Pipeline
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
    print("Loading heart disease dataset...")
    
    # Load the dataset
    df = pd.read_csv(os.path.join(DATA_DIR, 'Heart_Disease_Prediction.csv'))
    
    print(f"Dataset shape: {df.shape}")
    print(f"Columns: {df.columns.tolist()}")
    
    # Check for missing values
    missing_values = df.isnull().sum()
    print(f"Missing values: {missing_values[missing_values > 0]}")
    
    # Identify numeric and categorical columns
    numeric_cols = df.select_dtypes(include=['int64', 'float64']).columns.tolist()
    categorical_cols = df.select_dtypes(include=['object']).columns.tolist()
    
    print(f"Numeric columns: {numeric_cols}")
    print(f"Categorical columns: {categorical_cols}")
    
    # Handle missing values - numeric columns with median, categorical with mode
    for col in numeric_cols:
        if df[col].isnull().sum() > 0:
            df[col] = df[col].fillna(df[col].median())
            
    for col in categorical_cols:
        if df[col].isnull().sum() > 0:
            df[col] = df[col].fillna(df[col].mode()[0])
    
    # Exploratory Data Analysis
    plt.figure(figsize=(10, 6))
    sns.countplot(x='Heart Disease', data=df)
    plt.title('Heart Disease Distribution')
    plt.savefig(os.path.join(MODEL_DIR, 'heart_disease_distribution.png'))
    
    # Encode categorical features
    categorical_cols = df.select_dtypes(include=['object']).columns.tolist()
    
    # Remove target from categorical columns if it's there
    if 'Heart Disease' in categorical_cols:
        categorical_cols.remove('Heart Disease')
    
    # Apply one-hot encoding to categorical columns
    print("Encoding categorical features...")
    df_encoded = pd.get_dummies(df, columns=categorical_cols, drop_first=True)
    
    print(f"Dataset shape after encoding: {df_encoded.shape}")
    print(f"Columns after encoding: {df_encoded.columns[:5].tolist()}...")
    
    # Extract features (X) and target (y)
    X = df_encoded.drop('Heart Disease', axis=1)
    y = df_encoded['Heart Disease']
    
    # Convert target to binary if needed
    if y.dtype == 'object':
        print("Converting target to binary...")
        y = y.map({'Absence': 0, 'Presence': 1})
    
    # Split the data into training and testing sets
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    
    print(f"Training set shape: {X_train.shape}")
    print(f"Testing set shape: {X_test.shape}")
    
    return X_train, X_test, y_train, y_test, X.columns

def train_random_forest(X_train, y_train):
    """Train a Random Forest model with hyperparameter tuning"""
    print("Training Random Forest model...")
    
    # Create a pipeline with preprocessing and model
    pipeline = Pipeline([
        ('scaler', StandardScaler()),
        ('classifier', RandomForestClassifier(random_state=42))
    ])
    
    # Define the parameter grid for GridSearchCV
    param_grid = {
        'classifier__n_estimators': [100, 200, 300],
        'classifier__max_depth': [None, 10, 20, 30],
        'classifier__min_samples_split': [2, 5, 10],
        'classifier__min_samples_leaf': [1, 2, 4]
    }
    
    # Perform grid search with cross-validation
    grid_search = GridSearchCV(
        estimator=pipeline,
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

def train_gradient_boosting(X_train, y_train):
    """Train a Gradient Boosting model with hyperparameter tuning"""
    print("Training Gradient Boosting model...")
    
    # Create a pipeline with preprocessing and model
    pipeline = Pipeline([
        ('scaler', StandardScaler()),
        ('classifier', GradientBoostingClassifier(random_state=42))
    ])
    
    # Define the parameter grid for GridSearchCV
    param_grid = {
        'classifier__n_estimators': [100, 200, 300],
        'classifier__learning_rate': [0.01, 0.1, 0.2],
        'classifier__max_depth': [3, 4, 5],
        'classifier__subsample': [0.8, 0.9, 1.0]
    }
    
    # Perform grid search with cross-validation
    grid_search = GridSearchCV(
        estimator=pipeline,
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

def evaluate_model(model, X_test, y_test, model_name):
    """Evaluate the trained model"""
    print(f"Evaluating {model_name} performance...")
    
    # Make predictions
    y_pred = model.predict(X_test)
    
    # Calculate accuracy
    accuracy = accuracy_score(y_test, y_pred)
    print(f"Accuracy: {accuracy:.4f}")
    
    # Generate classification report
    report = classification_report(y_test, y_pred)
    print("Classification Report:")
    print(report)
    
    # Plot confusion matrix
    plt.figure(figsize=(8, 6))
    cm = confusion_matrix(y_test, y_pred)
    sns.heatmap(cm, annot=True, fmt='d', cmap='Blues')
    plt.title(f'Confusion Matrix - {model_name}')
    plt.ylabel('True Label')
    plt.xlabel('Predicted Label')
    plt.savefig(os.path.join(MODEL_DIR, f'heart_disease_{model_name.lower().replace(" ", "_")}_confusion_matrix.png'))
    
    # ROC curve
    y_proba = model.predict_proba(X_test)[:, 1]
    fpr, tpr, _ = roc_curve(y_test, y_proba)
    roc_auc = auc(fpr, tpr)
    
    plt.figure(figsize=(8, 6))
    plt.plot(fpr, tpr, color='darkorange', lw=2, label=f'ROC curve (area = {roc_auc:.2f})')
    plt.plot([0, 1], [0, 1], color='navy', lw=2, linestyle='--')
    plt.xlim([0.0, 1.0])
    plt.ylim([0.0, 1.05])
    plt.xlabel('False Positive Rate')
    plt.ylabel('True Positive Rate')
    plt.title(f'ROC Curve - {model_name}')
    plt.legend(loc="lower right")
    plt.savefig(os.path.join(MODEL_DIR, f'heart_disease_{model_name.lower().replace(" ", "_")}_roc_curve.png'))
    
    return accuracy

def feature_importance(model, feature_names, model_name):
    """Plot feature importance for the model"""
    if model_name == "Random Forest":
        # Get feature importance from the classifier in the pipeline
        importances = model.named_steps['classifier'].feature_importances_
        indices = np.argsort(importances)[::-1]
        
        plt.figure(figsize=(12, 8))
        plt.title(f'Feature Importance - {model_name}')
        plt.bar(range(len(importances)), importances[indices], align='center')
        plt.xticks(range(len(importances)), [feature_names[i] for i in indices], rotation=90)
        plt.tight_layout()
        plt.savefig(os.path.join(MODEL_DIR, f'heart_disease_{model_name.lower().replace(" ", "_")}_feature_importance.png'))

def save_model(model, model_name):
    """Save the trained model"""
    print(f"Saving {model_name} model...")
    
    # Save the model
    model_path = os.path.join(MODEL_DIR, f'heart_disease_{model_name.lower().replace(" ", "_")}_model.pkl')
    joblib.dump(model, model_path)
    print(f"Model saved to {model_path}")

def main():
    """Main function to train and evaluate the models"""
    print("Starting heart disease prediction model training...")
    
    # Load and prepare data
    X_train, X_test, y_train, y_test, feature_names = load_and_prepare_data()
    
    # Train Random Forest model
    rf_model = train_random_forest(X_train, y_train)
    rf_accuracy = evaluate_model(rf_model, X_test, y_test, "Random Forest")
    feature_importance(rf_model, feature_names, "Random Forest")
    save_model(rf_model, "Random Forest")
    
    # Train Gradient Boosting model
    gb_model = train_gradient_boosting(X_train, y_train)
    gb_accuracy = evaluate_model(gb_model, X_test, y_test, "Gradient Boosting")
    save_model(gb_model, "Gradient Boosting")
    
    # Compare models
    print("\nModel Comparison:")
    print(f"Random Forest Accuracy: {rf_accuracy:.4f}")
    print(f"Gradient Boosting Accuracy: {gb_accuracy:.4f}")
    
    # Save the best model as the default heart disease model
    if rf_accuracy >= gb_accuracy:
        best_model = rf_model
        best_model_name = "Random Forest"
    else:
        best_model = gb_model
        best_model_name = "Gradient Boosting"
    
    best_model_path = os.path.join(MODEL_DIR, 'heart_disease_model.pkl')
    joblib.dump(best_model, best_model_path)
    print(f"Best model ({best_model_name}) saved as the default heart disease model")
    
    print("Heart disease prediction model training completed!")

if __name__ == "__main__":
    main()
