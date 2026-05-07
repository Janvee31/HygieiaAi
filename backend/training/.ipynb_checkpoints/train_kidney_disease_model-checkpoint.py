"""
Chronic Kidney Disease Prediction Model Training Script
Uses multiple models and feature engineering for early detection of kidney disease
"""

import pandas as pd
import numpy as np
import os
import matplotlib.pyplot as plt
import seaborn as sns
import argparse
from sklearn.model_selection import train_test_split, GridSearchCV, StratifiedKFold
from sklearn.preprocessing import StandardScaler, LabelEncoder, OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer, KNNImputer
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier, AdaBoostClassifier, VotingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.svm import SVC
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix, roc_curve, auc, precision_recall_curve
from sklearn.feature_selection import SelectKBest, f_classif, RFE, VarianceThreshold
import joblib
import warnings
warnings.filterwarnings('ignore')

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

def parse_args():
    parser = argparse.ArgumentParser(description='Train a kidney disease prediction model')
    parser.add_argument('--fast', action='store_true', help='Use a smaller dataset and fewer iterations for faster training')
    return parser.parse_args()

def load_and_prepare_data(fast_mode=False):
    """Load and prepare the chronic kidney disease dataset for training"""
    print("Loading chronic kidney disease dataset...")
    
    # Load the dataset
    df = pd.read_csv(os.path.join(DATA_DIR, 'chronic_kidney_dataset.csv'))
    
    print(f"Dataset shape: {df.shape}")
    print(f"Columns: {df.columns.tolist()}")
    
    # If fast mode is enabled, use a smaller subset of the data
    if fast_mode and len(df) > 30:
        print("Fast mode enabled: Using a smaller dataset")
        df = df.sample(30, random_state=42)
    
    # Check for missing values
    missing_values = df.isnull().sum()
    print(f"Missing values: {missing_values[missing_values > 0]}")
    
    # Identify the target column (usually 'class' or similar)
    target_col = None
    for col in df.columns:
        if 'class' in col.lower() or 'disease' in col.lower() or 'ckd' in col.lower():
            target_col = col
            break
    
    if target_col is None:
        # If no obvious target column, assume it's the last column
        target_col = df.columns[-1]
    
    print(f"Target column: {target_col}")
    
    # Identify numerical and categorical columns
    numeric_features = []
    categorical_features = []
    
    for col in df.columns:
        if col == target_col:
            continue
        
        # Check if column contains mostly numeric values
        try:
            pd.to_numeric(df[col], errors='raise')
            numeric_features.append(col)
        except:
            categorical_features.append(col)
    
    print(f"Numeric features: {numeric_features}")
    print(f"Categorical features: {categorical_features}")
    
    # Exploratory Data Analysis
    plt.figure(figsize=(10, 6))
    sns.countplot(x=target_col, data=df)
    plt.title('Chronic Kidney Disease Distribution')
    plt.savefig(os.path.join(MODEL_DIR, 'kidney_disease_distribution.png'))
    
    # Correlation matrix for numeric features
    if len(numeric_features) > 0:
        plt.figure(figsize=(16, 12))
        # Convert to numeric if possible
        numeric_df = df[numeric_features].apply(pd.to_numeric, errors='coerce')
        correlation_matrix = numeric_df.corr()
        sns.heatmap(correlation_matrix, annot=True, cmap='coolwarm', fmt='.2f')
        plt.title('Correlation Matrix')
        plt.tight_layout()
        plt.savefig(os.path.join(MODEL_DIR, 'kidney_disease_correlation_matrix.png'))
    
    # Encode the target variable if needed
    le = LabelEncoder()
    if df[target_col].dtype == 'object':
        df[target_col] = le.fit_transform(df[target_col])
        print(f"Target classes: {list(le.classes_)} -> {list(le.transform(le.classes_))}")
    
    # Extract features (X) and target (y)
    X = df.drop(target_col, axis=1)
    y = df[target_col]
    
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
        ('imputer', KNNImputer(n_neighbors=5)),
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

def train_random_forest(X_train, y_train, preprocessor, fast_mode=False):
    """Train a Random Forest model with hyperparameter tuning"""
    print("Training Random Forest model...")
    
    # Create a pipeline with preprocessing and model
    pipeline = Pipeline(steps=[
        ('preprocessor', preprocessor),
        ('variance_threshold', VarianceThreshold(threshold=0.01)),  # Remove constant features
        ('classifier', RandomForestClassifier(n_estimators=100, max_depth=10, random_state=42))
    ])
    
    # Define a simplified parameter grid for GridSearchCV (for hackathon)
    if fast_mode:
        param_grid = {
            'classifier__n_estimators': [50],
            'classifier__max_depth': [5]
        }
    else:
        param_grid = {
            'classifier__n_estimators': [50, 100],
            'classifier__max_depth': [5, 10]
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

def train_logistic_regression(X_train, y_train, preprocessor, fast_mode=False):
    """Train a Logistic Regression model with hyperparameter tuning"""
    print("Training Logistic Regression model...")
    
    # Create a pipeline with preprocessing and model
    pipeline = Pipeline(steps=[
        ('preprocessor', preprocessor),
        ('variance_threshold', VarianceThreshold(threshold=0.01)),  # Remove constant features
        ('feature_selection', SelectKBest(f_classif, k=10)),
        ('classifier', LogisticRegression(random_state=42, max_iter=1000))
    ])
    
    # Define the parameter grid for GridSearchCV
    if fast_mode:
        param_grid = {
            'feature_selection__k': [10],
            'classifier__C': [1],
            'classifier__penalty': ['l2'],
            'classifier__solver': ['lbfgs']
        }
    else:
        param_grid = {
            'feature_selection__k': [5, 10, 15, 'all'],
            'classifier__C': [0.01, 0.1, 1, 10, 100],
            'classifier__penalty': ['l1', 'l2', 'elasticnet', None],
            'classifier__solver': ['newton-cg', 'lbfgs', 'liblinear', 'sag', 'saga'],
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

def train_gradient_boosting(X_train, y_train, preprocessor, fast_mode=False):
    """Train a Gradient Boosting model with hyperparameter tuning"""
    print("Training Gradient Boosting model...")
    
    # Create a pipeline with preprocessing and model
    pipeline = Pipeline(steps=[
        ('preprocessor', preprocessor),
        ('variance_threshold', VarianceThreshold(threshold=0.01)),  # Remove constant features
        ('feature_selection', SelectKBest(f_classif, k=10)),
        ('classifier', GradientBoostingClassifier(random_state=42))
    ])
    
    # Define the parameter grid for GridSearchCV
    if fast_mode:
        param_grid = {
            'feature_selection__k': [10],
            'classifier__n_estimators': [50],
            'classifier__learning_rate': [0.1],
            'classifier__max_depth': [3]
        }
    else:
        param_grid = {
            'feature_selection__k': [5, 10, 15, 'all'],
            'classifier__n_estimators': [50, 100, 200],
            'classifier__learning_rate': [0.01, 0.1, 0.2],
            'classifier__max_depth': [3, 5, 7],
            'classifier__subsample': [0.8, 1.0]
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

def train_svm(X_train, y_train, preprocessor, fast_mode=False):
    """Train an SVM model with hyperparameter tuning"""
    print("Training SVM model...")
    
    # Create a pipeline with preprocessing and model
    pipeline = Pipeline(steps=[
        ('preprocessor', preprocessor),
        ('variance_threshold', VarianceThreshold(threshold=0.01)),  # Remove constant features
        ('feature_selection', SelectKBest(f_classif, k=10)),
        ('classifier', SVC(random_state=42, probability=True))
    ])
    
    # Define the parameter grid for GridSearchCV
    if fast_mode:
        param_grid = {
            'feature_selection__k': [10],
            'classifier__C': [1],
            'classifier__gamma': ['scale'],
            'classifier__kernel': ['rbf']
        }
    else:
        param_grid = {
            'feature_selection__k': [5, 10, 15, 'all'],
            'classifier__C': [0.1, 1, 10, 100],
            'classifier__gamma': ['scale', 'auto', 0.1, 0.01],
            'classifier__kernel': ['rbf', 'linear', 'poly'],
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

def train_ensemble(rf_model, lr_model, gb_model, svm_model, X_train, y_train):
    """Train an ensemble model using voting classifier"""
    print("Training Ensemble model...")
    
    # Create a voting classifier
    ensemble = VotingClassifier(
        estimators=[
            ('rf', rf_model),
            ('lr', lr_model),
            ('gb', gb_model),
            ('svm', svm_model)
        ],
        voting='soft'
    )
    
    # Fit the ensemble model
    ensemble.fit(X_train, y_train)
    
    return ensemble

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
    plt.savefig(os.path.join(MODEL_DIR, f'kidney_disease_{model_name.lower().replace(" ", "_")}_confusion_matrix.png'))
    
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
    plt.savefig(os.path.join(MODEL_DIR, f'kidney_disease_{model_name.lower().replace(" ", "_")}_roc_curve.png'))
    
    # Precision-Recall curve
    precision, recall, _ = precision_recall_curve(y_test, y_proba)
    
    plt.figure(figsize=(8, 6))
    plt.plot(recall, precision, color='blue', lw=2)
    plt.xlabel('Recall')
    plt.ylabel('Precision')
    plt.title(f'Precision-Recall Curve - {model_name}')
    plt.savefig(os.path.join(MODEL_DIR, f'kidney_disease_{model_name.lower().replace(" ", "_")}_pr_curve.png'))
    
    return accuracy, roc_auc

def save_model(model, model_name):
    """Save the trained model"""
    print(f"Saving {model_name} model...")
    
    # Save the model
    model_path = os.path.join(MODEL_DIR, f'kidney_disease_{model_name.lower().replace(" ", "_")}_model.pkl')
    joblib.dump(model, model_path)
    print(f"Model saved to {model_path}")

def main():
    """Main function to train and evaluate the models"""
    print("Starting chronic kidney disease prediction model training...")
    
    # Parse command-line arguments
    args = parse_args()
    fast_mode = args.fast
    
    if fast_mode:
        print("FAST MODE ENABLED: Training will be quicker but potentially less accurate")
    
    # Load and prepare data
    X_train, X_test, y_train, y_test, numeric_features, categorical_features = load_and_prepare_data(fast_mode)
    
    # Create preprocessing pipeline
    preprocessor = create_preprocessing_pipeline(numeric_features, categorical_features)
    
    # Train Random Forest model
    rf_model = train_random_forest(X_train, y_train, preprocessor, fast_mode)
    rf_accuracy, rf_auc = evaluate_model(rf_model, X_test, y_test, "Random Forest")
    save_model(rf_model, "Random Forest")
    
    # Train Logistic Regression model
    lr_model = train_logistic_regression(X_train, y_train, preprocessor, fast_mode)
    lr_accuracy, lr_auc = evaluate_model(lr_model, X_test, y_test, "Logistic Regression")
    save_model(lr_model, "Logistic Regression")
    
    # Train Gradient Boosting model
    gb_model = train_gradient_boosting(X_train, y_train, preprocessor, fast_mode)
    gb_accuracy, gb_auc = evaluate_model(gb_model, X_test, y_test, "Gradient Boosting")
    save_model(gb_model, "Gradient Boosting")
    
    # Train SVM model
    svm_model = train_svm(X_train, y_train, preprocessor, fast_mode)
    svm_accuracy, svm_auc = evaluate_model(svm_model, X_test, y_test, "SVM")
    save_model(svm_model, "SVM")
    
    # Train Ensemble model
    ensemble_model = train_ensemble(rf_model, lr_model, gb_model, svm_model, X_train, y_train)
    ensemble_accuracy, ensemble_auc = evaluate_model(ensemble_model, X_test, y_test, "Ensemble")
    save_model(ensemble_model, "Ensemble")
    
    # Compare models
    print("\nModel Comparison:")
    print(f"Random Forest - Accuracy: {rf_accuracy:.4f}, AUC: {rf_auc:.4f}")
    print(f"Logistic Regression - Accuracy: {lr_accuracy:.4f}, AUC: {lr_auc:.4f}")
    print(f"Gradient Boosting - Accuracy: {gb_accuracy:.4f}, AUC: {gb_auc:.4f}")
    print(f"SVM - Accuracy: {svm_accuracy:.4f}, AUC: {svm_auc:.4f}")
    print(f"Ensemble - Accuracy: {ensemble_accuracy:.4f}, AUC: {ensemble_auc:.4f}")
    
    # Find the best model based on AUC
    models_auc = {
        "Random Forest": rf_auc,
        "Logistic Regression": lr_auc,
        "Gradient Boosting": gb_auc,
        "SVM": svm_auc,
        "Ensemble": ensemble_auc
    }
    
    best_model_name = max(models_auc, key=models_auc.get)
    print(f"\nBest model: {best_model_name} with AUC {models_auc[best_model_name]:.4f}")
    
    # Save the best model as the default kidney disease model
    if best_model_name == "Random Forest":
        best_model = rf_model
    elif best_model_name == "Logistic Regression":
        best_model = lr_model
    elif best_model_name == "Gradient Boosting":
        best_model = gb_model
    elif best_model_name == "SVM":
        best_model = svm_model
    else:
        best_model = ensemble_model
    
    best_model_path = os.path.join(MODEL_DIR, 'kidney_disease_model.pkl')
    joblib.dump(best_model, best_model_path)
    print(f"Best model ({best_model_name}) saved as the default kidney disease model")
    
    print("Chronic kidney disease prediction model training completed!")

if __name__ == "__main__":
    main()
