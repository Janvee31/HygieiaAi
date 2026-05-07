"""
Lung Cancer Prediction Model Training Script
Uses multiple models and feature selection techniques for early lung cancer detection
"""

import pandas as pd
import numpy as np
import os
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.model_selection import train_test_split, GridSearchCV, StratifiedKFold
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier, AdaBoostClassifier
from sklearn.svm import SVC
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix, roc_curve, auc, precision_recall_curve
from sklearn.pipeline import Pipeline
from sklearn.feature_selection import SelectFromModel, RFE
from xgboost import XGBClassifier
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
    """Load and prepare the lung cancer dataset for training"""
    print("Loading lung cancer dataset...")
    
    # Load the dataset
    df = pd.read_csv(os.path.join(DATA_DIR, 'lung_cancer.csv'))
    
    print(f"Dataset shape: {df.shape}")
    print(f"Columns: {df.columns.tolist()}")
    
    # Check for missing values
    missing_values = df.isnull().sum()
    print(f"Missing values: {missing_values[missing_values > 0]}")
    
    # Handle missing values if any
    if missing_values.sum() > 0:
        df = df.dropna()
        print(f"Shape after dropping missing values: {df.shape}")
    
    # Encode categorical variables if needed
    categorical_cols = df.select_dtypes(include=['object']).columns
    for col in categorical_cols:
        le = LabelEncoder()
        df[col] = le.fit_transform(df[col])
        print(f"Encoded {col}: {list(le.classes_)} -> {list(le.transform(le.classes_))}")
    
    # Identify the target column (usually 'LUNG_CANCER' or similar)
    target_col = None
    for col in df.columns:
        if 'cancer' in col.lower() or 'lung' in col.lower():
            target_col = col
            break
    
    if target_col is None:
        # If no obvious target column, assume it's the last column
        target_col = df.columns[-1]
    
    print(f"Target column: {target_col}")
    
    # Exploratory Data Analysis
    plt.figure(figsize=(10, 6))
    sns.countplot(x=target_col, data=df)
    plt.title('Lung Cancer Distribution')
    plt.savefig(os.path.join(MODEL_DIR, 'lung_cancer_distribution.png'))
    
    # Correlation matrix
    plt.figure(figsize=(12, 10))
    numeric_cols = df.select_dtypes(include=['float64', 'int64']).columns
    correlation_matrix = df[numeric_cols].corr()
    sns.heatmap(correlation_matrix, annot=True, cmap='coolwarm', fmt='.2f')
    plt.title('Correlation Matrix')
    plt.tight_layout()
    plt.savefig(os.path.join(MODEL_DIR, 'lung_cancer_correlation_matrix.png'))
    
    # Extract features (X) and target (y)
    X = df.drop(target_col, axis=1)
    y = df[target_col]
    
    # Split the data into training and testing sets
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    
    print(f"Training set shape: {X_train.shape}")
    print(f"Testing set shape: {X_test.shape}")
    
    return X_train, X_test, y_train, y_test, X.columns

def perform_feature_selection(X_train, y_train):
    """Perform feature selection using multiple methods"""
    print("Performing feature selection...")
    
    # Method 1: Random Forest feature importance
    rf = RandomForestClassifier(n_estimators=100, random_state=42)
    rf.fit(X_train, y_train)
    
    # Plot feature importance
    plt.figure(figsize=(12, 8))
    importances = rf.feature_importances_
    indices = np.argsort(importances)[::-1]
    plt.title('Random Forest Feature Importance')
    plt.bar(range(X_train.shape[1]), importances[indices], align='center')
    plt.xticks(range(X_train.shape[1]), X_train.columns[indices], rotation=90)
    plt.tight_layout()
    plt.savefig(os.path.join(MODEL_DIR, 'lung_cancer_rf_feature_importance.png'))
    
    # Method 2: Recursive Feature Elimination
    svc = SVC(kernel="linear", C=1)
    rfe = RFE(estimator=svc, n_features_to_select=10, step=1)
    rfe.fit(X_train, y_train)
    
    # Plot RFE selected features
    plt.figure(figsize=(12, 8))
    plt.title('RFE Selected Features')
    plt.bar(range(len(rfe.ranking_)), rfe.ranking_)
    plt.xticks(range(len(rfe.ranking_)), X_train.columns, rotation=90)
    plt.tight_layout()
    plt.savefig(os.path.join(MODEL_DIR, 'lung_cancer_rfe_features.png'))
    
    # Method 3: XGBoost feature importance
    xgb = XGBClassifier(n_estimators=100, random_state=42)
    xgb.fit(X_train, y_train)
    
    # Plot XGBoost feature importance
    plt.figure(figsize=(12, 8))
    importances = xgb.feature_importances_
    indices = np.argsort(importances)[::-1]
    plt.title('XGBoost Feature Importance')
    plt.bar(range(X_train.shape[1]), importances[indices], align='center')
    plt.xticks(range(X_train.shape[1]), X_train.columns[indices], rotation=90)
    plt.tight_layout()
    plt.savefig(os.path.join(MODEL_DIR, 'lung_cancer_xgb_feature_importance.png'))
    
    # Select top features using XGBoost
    selector = SelectFromModel(xgb, threshold="median")
    selector.fit(X_train, y_train)
    
    # Get selected feature indices
    selected_features = X_train.columns[selector.get_support()]
    print(f"Selected features: {selected_features.tolist()}")
    
    return selector

def train_random_forest(X_train, y_train, feature_selector=None):
    """Train a Random Forest model with hyperparameter tuning"""
    print("Training Random Forest model...")
    
    # Create a pipeline with preprocessing, feature selection, and model
    if feature_selector:
        pipeline = Pipeline([
            ('scaler', StandardScaler()),
            ('feature_selector', feature_selector),
            ('classifier', RandomForestClassifier(random_state=42))
        ])
    else:
        pipeline = Pipeline([
            ('scaler', StandardScaler()),
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

def train_xgboost(X_train, y_train, feature_selector=None):
    """Train an XGBoost model with hyperparameter tuning"""
    print("Training XGBoost model...")
    
    # Create a pipeline with preprocessing, feature selection, and model
    if feature_selector:
        pipeline = Pipeline([
            ('scaler', StandardScaler()),
            ('feature_selector', feature_selector),
            ('classifier', XGBClassifier(random_state=42))
        ])
    else:
        pipeline = Pipeline([
            ('scaler', StandardScaler()),
            ('classifier', XGBClassifier(random_state=42))
        ])
    
    # Define the parameter grid for GridSearchCV
    param_grid = {
        'classifier__n_estimators': [100, 200, 300],
        'classifier__learning_rate': [0.01, 0.1, 0.2],
        'classifier__max_depth': [3, 5, 7],
        'classifier__subsample': [0.8, 0.9, 1.0],
        'classifier__colsample_bytree': [0.8, 0.9, 1.0]
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

def train_svm(X_train, y_train, feature_selector=None):
    """Train an SVM model with hyperparameter tuning"""
    print("Training SVM model...")
    
    # Create a pipeline with preprocessing, feature selection, and model
    if feature_selector:
        pipeline = Pipeline([
            ('scaler', StandardScaler()),
            ('feature_selector', feature_selector),
            ('classifier', SVC(probability=True, random_state=42))
        ])
    else:
        pipeline = Pipeline([
            ('scaler', StandardScaler()),
            ('classifier', SVC(probability=True, random_state=42))
        ])
    
    # Define the parameter grid for GridSearchCV
    param_grid = {
        'classifier__C': [0.1, 1, 10, 100],
        'classifier__kernel': ['linear', 'rbf', 'poly'],
        'classifier__gamma': ['scale', 'auto', 0.1, 0.01],
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
    plt.savefig(os.path.join(MODEL_DIR, f'lung_cancer_{model_name.lower().replace(" ", "_")}_confusion_matrix.png'))
    
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
    plt.savefig(os.path.join(MODEL_DIR, f'lung_cancer_{model_name.lower().replace(" ", "_")}_roc_curve.png'))
    
    # Precision-Recall curve
    precision, recall, _ = precision_recall_curve(y_test, y_proba)
    
    plt.figure(figsize=(8, 6))
    plt.plot(recall, precision, color='blue', lw=2)
    plt.xlabel('Recall')
    plt.ylabel('Precision')
    plt.title(f'Precision-Recall Curve - {model_name}')
    plt.savefig(os.path.join(MODEL_DIR, f'lung_cancer_{model_name.lower().replace(" ", "_")}_pr_curve.png'))
    
    return accuracy, roc_auc

def save_model(model, model_name):
    """Save the trained model"""
    print(f"Saving {model_name} model...")
    
    # Save the model
    model_path = os.path.join(MODEL_DIR, f'lung_cancer_{model_name.lower().replace(" ", "_")}_model.pkl')
    joblib.dump(model, model_path)
    print(f"Model saved to {model_path}")

def main():
    """Main function to train and evaluate the models"""
    print("Starting lung cancer prediction model training...")
    
    # Load and prepare data
    X_train, X_test, y_train, y_test, feature_names = load_and_prepare_data()
    
    # Perform feature selection
    feature_selector = perform_feature_selection(X_train, y_train)
    
    # Train Random Forest model
    rf_model = train_random_forest(X_train, y_train, feature_selector)
    rf_accuracy, rf_auc = evaluate_model(rf_model, X_test, y_test, "Random Forest")
    save_model(rf_model, "Random Forest")
    
    # Train XGBoost model
    xgb_model = train_xgboost(X_train, y_train, feature_selector)
    xgb_accuracy, xgb_auc = evaluate_model(xgb_model, X_test, y_test, "XGBoost")
    save_model(xgb_model, "XGBoost")
    
    # Train SVM model
    svm_model = train_svm(X_train, y_train, feature_selector)
    svm_accuracy, svm_auc = evaluate_model(svm_model, X_test, y_test, "SVM")
    save_model(svm_model, "SVM")
    
    # Compare models
    print("\nModel Comparison:")
    print(f"Random Forest - Accuracy: {rf_accuracy:.4f}, AUC: {rf_auc:.4f}")
    print(f"XGBoost - Accuracy: {xgb_accuracy:.4f}, AUC: {xgb_auc:.4f}")
    print(f"SVM - Accuracy: {svm_accuracy:.4f}, AUC: {svm_auc:.4f}")
    
    # Find the best model based on AUC
    models_auc = {
        "Random Forest": rf_auc,
        "XGBoost": xgb_auc,
        "SVM": svm_auc
    }
    
    best_model_name = max(models_auc, key=models_auc.get)
    print(f"\nBest model: {best_model_name} with AUC {models_auc[best_model_name]:.4f}")
    
    # Save the best model as the default lung cancer model
    if best_model_name == "Random Forest":
        best_model = rf_model
    elif best_model_name == "XGBoost":
        best_model = xgb_model
    else:
        best_model = svm_model
    
    best_model_path = os.path.join(MODEL_DIR, 'lung_cancer_model.pkl')
    joblib.dump(best_model, best_model_path)
    print(f"Best model ({best_model_name}) saved as the default lung cancer model")
    
    print("Lung cancer prediction model training completed!")

if __name__ == "__main__":
    main()
