"""
Main script to train all disease prediction models
This script orchestrates the training of all disease prediction models
Optimized for hackathon demonstration with reduced dataset sizes
"""

import os
import sys
import subprocess
import time
import argparse
import psutil
import GPUtil

def print_header(message):
    """Print a formatted header message"""
    print("\n" + "=" * 80)
    print(f" {message} ".center(80, "="))
    print("=" * 80 + "\n")

def print_system_info():
    """Print system information for reference"""
    print_header("System Information")
    
    # CPU information
    cpu_info = f"CPU: {psutil.cpu_count(logical=False)} cores, {psutil.cpu_count()} threads"
    cpu_freq = psutil.cpu_freq()
    if cpu_freq:
        cpu_info += f" @ {cpu_freq.current/1000:.2f} GHz"
    print(cpu_info)
    
    # Memory information
    mem = psutil.virtual_memory()
    print(f"RAM: {mem.total/(1024**3):.2f} GB total, {mem.available/(1024**3):.2f} GB available")
    
    # GPU information
    try:
        gpus = GPUtil.getGPUs()
        for i, gpu in enumerate(gpus):
            print(f"GPU {i}: {gpu.name}, {gpu.memoryTotal} MB memory")
    except:
        print("GPU information not available")
    
    print("\n")

def train_model(script_name, model_name, fast_mode=True):
    """Train a specific model by running its training script"""
    print_header(f"Training {model_name} Model")
    
    script_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), script_name)
    
    try:
        # Run the training script with fast mode flag for hackathon
        start_time = time.time()
        cmd = [sys.executable, script_path]
        if fast_mode:
            cmd.append('--fast')
        process = subprocess.run(cmd, check=True)
        end_time = time.time()
        
        # Calculate training time
        training_time = end_time - start_time
        
        print(f"\n{model_name} model training completed successfully in {training_time:.2f} seconds.")
        return True
    except subprocess.CalledProcessError as e:
        print(f"\nError training {model_name} model: {str(e)}")
        return False

def main():
    """Main function to train all models"""
    parser = argparse.ArgumentParser(description='Train all disease prediction models')
    parser.add_argument('--fast', action='store_true', help='Use fast mode with reduced dataset for hackathon demo')
    parser.add_argument('--skip-diabetes', action='store_true', help='Skip diabetes model training')
    parser.add_argument('--skip-heart', action='store_true', help='Skip heart disease model training')
    parser.add_argument('--skip-liver', action='store_true', help='Skip liver disease model training')
    parser.add_argument('--skip-kidney', action='store_true', help='Skip kidney disease model training')
    parser.add_argument('--skip-thyroid', action='store_true', help='Skip thyroid disease model training')
    parser.add_argument('--skip-breast-cancer', action='store_true', help='Skip breast cancer model training')
    parser.add_argument('--skip-skin-cancer', action='store_true', help='Skip skin cancer model training')
    parser.add_argument('--skip-brain-tumor', action='store_true', help='Skip brain tumor model training')
    parser.add_argument('--image-only', action='store_true', help='Train only image-based models')
    args = parser.parse_args()
    
    # Print system information
    print_system_info()
    
    # Track overall training time
    overall_start_time = time.time()
    
    # Skip non-image models if --image-only is specified
    skip_non_image = args.image_only
    
    # Train diabetes model
    if not args.skip_diabetes and not skip_non_image:
        train_model('train_diabetes_model.py', 'Diabetes', args.fast)
    
    # Train heart disease model
    if not args.skip_heart and not skip_non_image:
        train_model('train_heart_disease_model.py', 'Heart Disease', args.fast)
    # Categorize models by type
    tabular_models = ['disease', 'heart', 'diabetes', 'liver', 'lung', 'kidney']
    image_models = ['breast_tumor', 'skin', 'brain_tumor']
    
    # Train each model
    results = {}
    total_start_time = time.time()
    
    # First train tabular models (faster)
    for model_key, (script_name, display_name) in models_to_train.items():
        if model_key in tabular_models:
            success = train_model(script_name, display_name, args.fast)
            results[model_key] = success
    
    # Then train image models (slower, GPU-intensive)
    for model_key, (script_name, display_name) in models_to_train.items():
        if model_key in image_models:
            success = train_model(script_name, display_name, args.fast)
            results[model_key] = success
    
    total_end_time = time.time()
    total_time = total_end_time - total_start_time
    
    # Print summary
    print_header("Training Summary")
    print(f"Total training time: {total_time:.2f} seconds")
    print("\nResults:")
    
    for model_key, success in results.items():
        status = "✅ Success" if success else "❌ Failed"
        print(f"- {all_models[model_key][1]}: {status}")
    
    # Count successes and failures
    successes = sum(1 for success in results.values() if success)
    failures = sum(1 for success in results.values() if not success)
    
    print(f"\nModels trained successfully: {successes}/{len(results)}")
    if failures > 0:
        print(f"Models failed: {failures}/{len(results)}")
        return 1
    else:
        print("\nAll models trained successfully!")
        return 0

if __name__ == "__main__":
    sys.exit(main())
