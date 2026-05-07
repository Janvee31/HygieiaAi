import xgboost as xgb
import inspect

model = xgb.XGBClassifier()
print("Dir of model:", dir(model))

# Check if classes_ is a property and what it does
print("\nclasses_ property:", getattr(xgb.XGBClassifier, 'classes_', 'Not found'))

# Try to find where classes are stored
try:
    import sklearn
    print("Scikit-learn version:", sklearn.__version__)
except:
    pass
