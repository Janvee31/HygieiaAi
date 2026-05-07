"""
Diabetes Prediction Model Training Script
Uses multiple models and ensemble techniques to predict diabetes
"""

import pandas as pd
import numpy as np
import os
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.model_selection import train_test_split, GridSearchCV, cross_val_score
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier, VotingClassifier
from sklearn.svm import SVC
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix, roc_curve, auc, precision_recall_curve
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
    """Load and prepare the diabetes dataset for training"""
    print("Loading diabetes dataset...")
    
    # Load the dataset
    df = pd.read_csv(os.path.join(DATA_DIR, 'diabetes.csv'))
    
    print(f"Dataset shape: {df.shape}")
    print(f"Columns: {df.columns.tolist()}")
    
    # Check for missing values
    missing_values = df.isnull().sum()
    print(f"Missing values: {missing_values[missing_values > 0]}")
    
    # Check for zero values in columns that shouldn't have zeros
    zero_columns = ['Glucose', 'BloodPressure', 'SkinThickness', 'Insulin', 'BMI']
    for column in zero_columns:
        zero_count = (df[column] == 0).sum()
        print(f"Zeros in {column}: {zero_count} ({zero_count/len(df)*100:.2f}%)")
    
    # Replace zeros with NaN and then fill with median
    for column in zero_columns:
        df[column] = df[column].replace(0, np.nan)
        df[column] = df[column].fillna(df[column].median())
    
    # Exploratory Data Analysis
    plt.figure(figsize=(10, 6))
    sns.countplot(x='Outcome', data=df)
    plt.title('Diabetes Outcome Distribution')
    plt.savefig(os.path.join(MODEL_DIR, 'diabetes_distribution.png'))
    
    # Correlation matrix
    plt.figure(figsize=(12, 10))
    correlation_matrix = df.corr()
    sns.heatmap(correlation_matrix, annot=True, cmap='coolwarm', fmt='.2f')
    plt.title('Correlation Matrix')
    plt.tight_layout()
    plt.savefig(os.path.join(MODEL_DIR, 'diabetes_correlation_matrix.png'))
    
    # Extract features (X) and target (y)
    X = df.drop('Outcome', axis=1)
    y = df['Outcome']
    
    # Split the data into training and testing sets
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    
    print(f"Training set shape: {X_train.shape}")
    print(f"Testing set shape: {X_test.shape}")
    
    return X_train, X_test, y_train, y_test, X.columns

def train_logistic_regression(X_train, y_train):
    """Train a Logistic Regression model with hyperparameter tuning"""
    print("Training Logistic Regression model...")
    
    # Create a pipeline with preprocessing and model
    pipeline = Pipeline([
        ('scaler', StandardScaler()),
        ('classifier', LogisticRegression(random_state=42, max_iter=1000))
    ])
    
    # Define the parameter grid for GridSearchCV
    param_grid = {
        'classifier__C': [0.01, 0.1, 1, 10, 100],
        'classifier__penalty': ['l1', 'l2', 'elasticnet', None],
        'classifier__solver': ['newton-cg', 'lbfgs', 'liblinear', 'sag', 'saga']
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

def train_svm(X_train, y_train):
    """Train an SVM model with hyperparameter tuning"""
    print("Training SVM model...")
    
    # Create a pipeline with preprocessing and model
    pipeline = Pipeline([
        ('scaler', StandardScaler()),
        ('classifier', SVC(random_state=42, probability=True))
    ])
    
    # Define the parameter grid for GridSearchCV
    param_grid = {
        'classifier__C': [0.1, 1, 10, 100],
        'classifier__kernel': ['linear', 'rbf', 'poly'],
        'classifier__gamma': ['scale', 'auto', 0.1, 0.01]
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

def train_ensemble(lr_model, rf_model, gb_model, svm_model, X_train, y_train):
    """Train an ensemble model using voting classifier"""
    print("Training Ensemble model...")
    
    # Create a voting classifier
    ensemble = VotingClassifier(
        estimators=[
            ('lr', lr_model),
            ('rf', rf_model),
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
    plt.savefig(os.path.join(MODEL_DIR, f'diabetes_{model_name.lower().replace(" ", "_")}_confusion_matrix.png'))
    
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
    plt.savefig(os.path.join(MODEL_DIR, f'diabetes_{model_name.lower().replace(" ", "_")}_roc_curve.png'))
    
    # Precision-Recall curve
    precision, recall, _ = precision_recall_curve(y_test, y_proba)
    
    plt.figure(figsize=(8, 6))
    plt.plot(recall, precision, color='blue', lw=2)
    plt.xlabel('Recall')
    plt.ylabel('Precision')
    plt.title(f'Precision-Recall Curve - {model_name}')
    plt.savefig(os.path.join(MODEL_DIR, f'diabetes_{model_name.lower().replace(" ", "_")}_pr_curve.png'))
    
    return accuracy

def feature_importance(model, feature_names, model_name):
    """Plot feature importance for the model if applicable"""
    if model_name in ["Random Forest", "Gradient Boosting"]:
        # Get feature importance from the classifier in the pipeline
        importances = model.named_steps['classifier'].feature_importances_
        indices = np.argsort(importances)[::-1]
        
        plt.figure(figsize=(12, 8))
        plt.title(f'Feature Importance - {model_name}')
        plt.bar(range(len(importances)), importances[indices], align='center')
        plt.xticks(range(len(importances)), [feature_names[i] for i in indices], rotation=90)
        plt.tight_layout()
        plt.savefig(os.path.join(MODEL_DIR, f'diabetes_{model_name.lower().replace(" ", "_")}_feature_importance.png'))
    
    elif model_name == "Logistic Regression":
        # Get coefficients from the classifier in the pipeline
        coefficients = model.named_steps['classifier'].coef_[0]
        
        # Create a DataFrame for better visualization
        coef_df = pd.DataFrame({
            'Feature': feature_names,
            'Coefficient': coefficients
        })
        
        # Sort by absolute coefficient value
        coef_df = coef_df.reindex(coef_df['Coefficient'].abs().sort_values(ascending=False).index)
        
        plt.figure(figsize=(12, 8))
        plt.title(f'Feature Coefficients - {model_name}')
        plt.barh(range(len(coef_df)), coef_df['Coefficient'])
        plt.yticks(range(len(coef_df)), coef_df['Feature'])
        plt.axvline(x=0, color='k', linestyle='--')
        plt.tight_layout()
        plt.savefig(os.path.join(MODEL_DIR, f'diabetes_{model_name.lower().replace(" ", "_")}_coefficients.png'))

def save_model(model, model_name):
    """Save the trained model"""
    print(f"Saving {model_name} model...")
    
    # Save the model
    model_path = os.path.join(MODEL_DIR, f'diabetes_{model_name.lower().replace(" ", "_")}_model.pkl')
    joblib.dump(model, model_path)
    print(f"Model saved to {model_path}")

def main():
    """Main function to train and evaluate the models"""
    print("Starting diabetes prediction model training...")
    
    # Load and prepare data
    X_train, X_test, y_train, y_test, feature_names = load_and_prepare_data()
    
    # Train Logistic Regression model
    lr_model = train_logistic_regression(X_train, y_train)
    lr_accuracy = evaluate_model(lr_model, X_test, y_test, "Logistic Regression")
    feature_importance(lr_model, feature_names, "Logistic Regression")
    save_model(lr_model, "Logistic Regression")
    
    # Train Random Forest model
    rf_model = train_random_forest(X_train, y_train)
    rf_accuracy = evaluate_model(rf_model, X_test, y_test, "Random Forest")
    feature_importance(rf_model, feature_names, "Random Forest")
    save_model(rf_model, "Random Forest")
    
    # Train Gradient Boosting model
    gb_model = train_gradient_boosting(X_train, y_train)
    gb_accuracy = evaluate_model(gb_model, X_test, y_test, "Gradient Boosting")
    feature_importance(gb_model, feature_names, "Gradient Boosting")
    save_model(gb_model, "Gradient Boosting")
    
    # Train SVM model
    svm_model = train_svm(X_train, y_train)
    svm_accuracy = evaluate_model(svm_model, X_test, y_test, "SVM")
    save_model(svm_model, "SVM")
    
    # Train Ensemble model
    ensemble_model = train_ensemble(lr_model, rf_model, gb_model, svm_model, X_train, y_train)
    ensemble_accuracy = evaluate_model(ensemble_model, X_test, y_test, "Ensemble")
    save_model(ensemble_model, "Ensemble")
    
    # Compare models
    print("\nModel Comparison:")
    print(f"Logistic Regression Accuracy: {lr_accuracy:.4f}")
    print(f"Random Forest Accuracy: {rf_accuracy:.4f}")
    print(f"Gradient Boosting Accuracy: {gb_accuracy:.4f}")
    print(f"SVM Accuracy: {svm_accuracy:.4f}")
    print(f"Ensemble Accuracy: {ensemble_accuracy:.4f}")
    
    # Find the best model
    models = {
        "Logistic Regression": lr_accuracy,
        "Random Forest": rf_accuracy,
        "Gradient Boosting": gb_accuracy,
        "SVM": svm_accuracy,
        "Ensemble": ensemble_accuracy
    }
    
    best_model_name = max(models, key=models.get)
    print(f"\nBest model: {best_model_name} with accuracy {models[best_model_name]:.4f}")
    
    # Save the best model as the default diabetes model
    if best_model_name == "Logistic Regression":
        best_model = lr_model
    elif best_model_name == "Random Forest":
        best_model = rf_model
    elif best_model_name == "Gradient Boosting":
        best_model = gb_model
    elif best_model_name == "SVM":
        best_model = svm_model
    else:
        best_model = ensemble_model
    
    best_model_path = os.path.join(MODEL_DIR, 'diabetes_model.pkl')
    joblib.dump(best_model, best_model_path)
    print(f"Best model ({best_model_name}) saved as the default diabetes model")
    
    print("Diabetes prediction model training completed!")

if __name__ == "__main__":
    main()
