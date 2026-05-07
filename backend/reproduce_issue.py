import sys
import os

# Add the current directory to sys.path so we can import disease_model
current_dir = os.getcwd()
sys.path.append(current_dir)

try:
    from disease_model import DiseaseModel
    
    print("Initializing DiseaseModel...")
    model = DiseaseModel()
    
    model_path = os.path.join(current_dir, 'saved_models', 'xgboost_model.json')
    print(f"Loading model from: {model_path}")
    
    model.load_xgboost(model_path)
    
    # Check if attributes are set
    if hasattr(model.model, 'n_classes_'):
        print(f"SUCCESS: n_classes_ is set to {model.model.n_classes_}")
    else:
        print("FAILURE: n_classes_ is still missing!")
        
    if hasattr(model.model, 'classes_'):
        print(f"SUCCESS: classes_ is set (via property).")
        print(f"Classes: {model.model.classes_}")
    else:
        print("FAILURE: classes_ is still missing!")

except Exception as e:
    print(f"Error during verification: {e}")
    import traceback
    traceback.print_exc()
