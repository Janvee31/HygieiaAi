"""
Train all image models for Hygieia healthcare platform
Optimized for hackathon demonstration on i7 13th gen with RTX 4050
"""

import os
import sys
import argparse
import time
import subprocess

def print_header(message):
    """Print a formatted header message"""
    print("\n" + "=" * 80)
    print(f" {message} ".center(80, "="))
    print("=" * 80 + "\n")

def train_model(script_name, model_name, fast_mode=True):
    """Train a specific model by running its training script"""
    print_header(f"Training {model_name} Model")
    
    script_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), script_name)
    
    # Build command with appropriate flags
    cmd = [sys.executable, script_path]
    if fast_mode:
        cmd.append('--fast')
    
    # Print command for reference
    print(f"Running: {' '.join(cmd)}")
    print()
    
    # Track training time
    start_time = time.time()
    
    # Run the training script
    try:
        result = subprocess.run(cmd, check=True)
        success = result.returncode == 0
    except subprocess.CalledProcessError as e:
        print(f"Error training {model_name} model: {str(e)}")
        success = False
    
    # Calculate and print training time
    time_elapsed = time.time() - start_time
    minutes, seconds = divmod(time_elapsed, 60)
    
    print(f"\n{model_name} model training {'completed successfully' if success else 'failed'}")
    print(f"Training time: {int(minutes)}m {int(seconds)}s")
    
    return success

def main():
    """Main function to train all image models"""
    parser = argparse.ArgumentParser(description='Train all image models for Hygieia')
    parser.add_argument('--fast', action='store_true', help='Use fast mode for hackathon demo')
    parser.add_argument('--skip-breast', action='store_true', help='Skip breast cancer model')
    parser.add_argument('--skip-skin', action='store_true', help='Skip skin cancer model')
    parser.add_argument('--skip-brain', action='store_true', help='Skip brain tumor model')
    args = parser.parse_args()
    
    # Track overall training time
    overall_start_time = time.time()
    
    # Train breast cancer model
    if not args.skip_breast:
        print_header("TRAINING BREAST CANCER MODEL")
        train_model('train_breast_cancer_simplified.py', 'Breast Cancer', args.fast)
    
    # Train skin cancer model
    if not args.skip_skin:
        print_header("TRAINING SKIN CANCER MODEL")
        train_model('train_skin_cancer_model.py', 'Skin Cancer', args.fast)
    
    # Train brain tumor model
    if not args.skip_brain:
        print_header("TRAINING BRAIN TUMOR MODEL")
        train_model('train_brain_tumor_model.py', 'Brain Tumor', args.fast)
    
    # Print overall training time
    overall_time_elapsed = time.time() - overall_start_time
    hours, remainder = divmod(overall_time_elapsed, 3600)
    minutes, seconds = divmod(remainder, 60)
    
    print_header("ALL IMAGE MODELS TRAINING COMPLETE")
    print(f"Overall training time: {int(hours)}h {int(minutes)}m {int(seconds)}s")
    
    return 0

if __name__ == "__main__":
    sys.exit(main())
