import sys
import os
import xgboost as xgb
import numpy as np

# Mocking the path
current_dir = os.getcwd()
model_path = os.path.join(current_dir, 'saved_models', 'xgboost_model.json')

print(f"Attempting to load model from: {model_path}")

try:
    model = xgb.XGBClassifier()
    model.load_model(model_path)
    print("Model loaded successfully.")
    
    # Mock diseases list
    diseases = np.array(['Disease1', 'Disease2', 'Disease3'])
    
    # Try setting _classes
    try:
        model._classes = diseases
        print("Successfully set _classes")
    except Exception as e:
        print(f"Failed to set _classes: {e}")
        
    # Try setting n_classes_
    try:
        model.n_classes_ = len(diseases)
        print("Successfully set n_classes_")
    except Exception as e:
        print(f"Failed to set n_classes_: {e}")
        
    # Check if classes_ property works now
    try:
        print(f"classes_ property: {model.classes_}")
    except Exception as e:
        print(f"classes_ property access failed: {e}")

except Exception as e:
    print(f"Error loading model: {e}")
