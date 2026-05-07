"""
Liver Disease Prediction Model Training Script
Uses multiple models to predict liver disease from patient data
"""

import pandas as pd
import numpy as np
import os
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.model_selection import train_test_split, GridSearchCV, StratifiedKFold
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier, AdaBoostClassifier
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix, roc_curve, auc
from sklearn.feature_selection import SelectKBest, f_classif
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
    """Load and prepare the liver disease dataset for training"""
    print("Loading liver disease dataset...")
    
    # Load the dataset
    df = pd.read_csv(os.path.join(DATA_DIR, 'indian_liver_patient.csv'))
    
    print(f"Dataset shape: {df.shape}")
    print(f"Columns: {df.columns.tolist()}")
    
    # Check for missing values
    missing_values = df.isnull().sum()
    print(f"Missing values: {missing_values[missing_values > 0]}")
    
    # Exploratory Data Analysis
    plt.figure(figsize=(10, 6))
    sns.countplot(x='Dataset', data=df)
    plt.title('Liver Disease Distribution')
    plt.savefig(os.path.join(MODEL_DIR, 'liver_disease_distribution.png'))
    
    # Age distribution by disease status
    plt.figure(figsize=(10, 6))
    sns.histplot(data=df, x='Age', hue='Dataset', multiple='stack', bins=20)
    plt.title('Age Distribution by Disease Status')
    plt.savefig(os.path.join(MODEL_DIR, 'liver_disease_age_distribution.png'))
    
    # Gender distribution by disease status
    plt.figure(figsize=(10, 6))
    gender_disease = pd.crosstab(df['Gender'], df['Dataset'])
    gender_disease.plot(kind='bar', stacked=True)
    plt.title('Gender Distribution by Disease Status')
    plt.savefig(os.path.join(MODEL_DIR, 'liver_disease_gender_distribution.png'))
    
    # Correlation matrix
    plt.figure(figsize=(12, 10))
    numeric_cols = df.select_dtypes(include=['float64', 'int64']).columns
    correlation_matrix = df[numeric_cols].corr()
    sns.heatmap(correlation_matrix, annot=True, cmap='coolwarm', fmt='.2f')
    plt.title('Correlation Matrix')
    plt.tight_layout()
    plt.savefig(os.path.join(MODEL_DIR, 'liver_disease_correlation_matrix.png'))
    
    # Identify numerical and categorical columns
    numeric_features = df.select_dtypes(include=['int64', 'float64']).columns.tolist()
    numeric_features.remove('Dataset')  # Remove target variable
    categorical_features = df.select_dtypes(include=['object']).columns.tolist()
    
    print(f"Numeric features: {numeric_features}")
    print(f"Categorical features: {categorical_features}")
    
    # Extract features (X) and target (y)
    X = df.drop('Dataset', axis=1)
    y = df['Dataset']
    
    # Convert target to binary (1 for liver disease, 0 for no liver disease)
    y = y.map({1: 1, 2: 0})
    
    # Split the data into training and testing sets
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    
    print(f"Training set shape: {X_train.shape}")
    print(f"Testing set shape: {X_test.shape}")
    
    return X_train, X_test, y_train, y_test, numeric_features, categorical_features

def create_preprocessing_pipeline(numeric_features, categorical_features):
    """Create a preprocessing pipeline for numerical and categorical features"""
    
    # Preprocessing for numerical features
    numeric_transformer = Pipeline(steps=[
        ('imputer', SimpleImputer(strategy='median')),
        ('scaler', StandardScaler())
    ])
    
    # Preprocessing for categorical features
    categorical_transformer = Pipeline(steps=[
        ('imputer', SimpleImputer(strategy='most_frequent')),
        ('onehot', OneHotEncoder(handle_unknown='ignore'))
    ])
    
    # Combine preprocessing steps
    preprocessor = ColumnTransformer(
        transformers=[
            ('num', numeric_transformer, numeric_features),
            ('cat', categorical_transformer, categorical_features)
        ]
    )
    
    return preprocessor

def train_random_forest(X_train, y_train, preprocessor):
    """Train a Random Forest model with hyperparameter tuning"""
    print("Training Random Forest model...")
    
    # Create a pipeline with preprocessing and model
    pipeline = Pipeline(steps=[
        ('preprocessor', preprocessor),
        ('feature_selection', SelectKBest(f_classif, k=8)),
        ('classifier', RandomForestClassifier(random_state=42))
    ])
    
    # Define the parameter grid for GridSearchCV
    param_grid = {
        'classifier__n_estimators': [100, 200, 300],
        'classifier__max_depth': [None, 10, 20, 30],
        'classifier__min_samples_split': [2, 5, 10],
        'classifier__min_samples_leaf': [1, 2, 4],
        'classifier__class_weight': ['balanced', None]
    }
    
    # Perform grid search with cross-validation
    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    grid_search = GridSearchCV(
        estimator=pipeline,
        param_grid=param_grid,
        cv=cv,
        scoring='roc_auc',
        verbose=1,
        n_jobs=-1
    )
    
    # Fit the grid search to the data
    grid_search.fit(X_train, y_train)
    
    # Get the best model
    best_model = grid_search.best_estimator_
    print(f"Best parameters: {grid_search.best_params_}")
    
    return best_model

def train_gradient_boosting(X_train, y_train, preprocessor):
    """Train a Gradient Boosting model with hyperparameter tuning"""
    print("Training Gradient Boosting model...")
    
    # Create a pipeline with preprocessing and model
    pipeline = Pipeline(steps=[
        ('preprocessor', preprocessor),
        ('feature_selection', SelectKBest(f_classif, k=8)),
        ('classifier', GradientBoostingClassifier(random_state=42))
    ])
    
    # Define the parameter grid for GridSearchCV
    param_grid = {
        'classifier__n_estimators': [100, 200, 300],
        'classifier__learning_rate': [0.01, 0.1, 0.2],
        'classifier__max_depth': [3, 4, 5],
        'classifier__subsample': [0.8, 0.9, 1.0],
        'classifier__min_samples_split': [2, 5, 10]
    }
    
    # Perform grid search with cross-validation
    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    grid_search = GridSearchCV(
        estimator=pipeline,
        param_grid=param_grid,
        cv=cv,
        scoring='roc_auc',
        verbose=1,
        n_jobs=-1
    )
    
    # Fit the grid search to the data
    grid_search.fit(X_train, y_train)
    
    # Get the best model
    best_model = grid_search.best_estimator_
    print(f"Best parameters: {grid_search.best_params_}")
    
    return best_model

def train_adaboost(X_train, y_train, preprocessor):
    """Train an AdaBoost model with hyperparameter tuning"""
    print("Training AdaBoost model...")
    
    # Create a pipeline with preprocessing and model
    pipeline = Pipeline(steps=[
        ('preprocessor', preprocessor),
        ('feature_selection', SelectKBest(f_classif, k=8)),
        ('classifier', AdaBoostClassifier(random_state=42))
    ])
    
    # Define the parameter grid for GridSearchCV
    param_grid = {
        'classifier__n_estimators': [50, 100, 200],
        'classifier__learning_rate': [0.01, 0.1, 1.0],
        'classifier__algorithm': ['SAMME', 'SAMME.R']
    }
    
    # Perform grid search with cross-validation
    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    grid_search = GridSearchCV(
        estimator=pipeline,
        param_grid=param_grid,
        cv=cv,
        scoring='roc_auc',
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
    y_proba = model.predict_proba(X_test)[:, 1]
    
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
    plt.savefig(os.path.join(MODEL_DIR, f'liver_disease_{model_name.lower().replace(" ", "_")}_confusion_matrix.png'))
    
    # ROC curve
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
    plt.savefig(os.path.join(MODEL_DIR, f'liver_disease_{model_name.lower().replace(" ", "_")}_roc_curve.png'))
    
    return accuracy, roc_auc

def save_model(model, model_name):
    """Save the trained model"""
    print(f"Saving {model_name} model...")
    
    # Save the model
    model_path = os.path.join(MODEL_DIR, f'liver_disease_{model_name.lower().replace(" ", "_")}_model.pkl')
    joblib.dump(model, model_path)
    print(f"Model saved to {model_path}")

def main():
    """Main function to train and evaluate the models"""
    print("Starting liver disease prediction model training...")
    
    # Load and prepare data
    X_train, X_test, y_train, y_test, numeric_features, categorical_features = load_and_prepare_data()
    
    # Create preprocessing pipeline
    preprocessor = create_preprocessing_pipeline(numeric_features, categorical_features)
    
    # Train Random Forest model
    rf_model = train_random_forest(X_train, y_train, preprocessor)
    rf_accuracy, rf_auc = evaluate_model(rf_model, X_test, y_test, "Random Forest")
    save_model(rf_model, "Random Forest")
    
    # Train Gradient Boosting model
    gb_model = train_gradient_boosting(X_train, y_train, preprocessor)
    gb_accuracy, gb_auc = evaluate_model(gb_model, X_test, y_test, "Gradient Boosting")
    save_model(gb_model, "Gradient Boosting")
    
    # Train AdaBoost model
    ada_model = train_adaboost(X_train, y_train, preprocessor)
    ada_accuracy, ada_auc = evaluate_model(ada_model, X_test, y_test, "AdaBoost")
    save_model(ada_model, "AdaBoost")
    
    # Compare models
    print("\nModel Comparison:")
    print(f"Random Forest - Accuracy: {rf_accuracy:.4f}, AUC: {rf_auc:.4f}")
    print(f"Gradient Boosting - Accuracy: {gb_accuracy:.4f}, AUC: {gb_auc:.4f}")
    print(f"AdaBoost - Accuracy: {ada_accuracy:.4f}, AUC: {ada_auc:.4f}")
    
    # Find the best model based on AUC
    models_auc = {
        "Random Forest": rf_auc,
        "Gradient Boosting": gb_auc,
        "AdaBoost": ada_auc
    }
    
    best_model_name = max(models_auc, key=models_auc.get)
    print(f"\nBest model: {best_model_name} with AUC {models_auc[best_model_name]:.4f}")
    
    # Save the best model as the default liver disease model
    if best_model_name == "Random Forest":
        best_model = rf_model
    elif best_model_name == "Gradient Boosting":
        best_model = gb_model
    else:
        best_model = ada_model
    
    best_model_path = os.path.join(MODEL_DIR, 'liver_disease_model.pkl')
    joblib.dump(best_model, best_model_path)
    print(f"Best model ({best_model_name}) saved as the default liver disease model")
    
    print("Liver disease prediction model training completed!")

if __name__ == "__main__":
    main()
