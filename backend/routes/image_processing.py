from fastapi import APIRouter, UploadFile, File, HTTPException
import numpy as np
import cv2
import io
import os
import logging
import traceback
from PIL import Image
import requests
import base64
import json
from typing import Optional
from dotenv import load_dotenv
import google.generativeai as genai

try:
    import torch
    from torchvision import transforms
    TORCH_AVAILABLE = True
    TORCH_IMPORT_ERROR = None
except Exception as exc:
    torch = None
    transforms = None
    TORCH_AVAILABLE = False
    TORCH_IMPORT_ERROR = exc

router = APIRouter()
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# Get Gemini API key from environment variable
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
genai.configure(api_key=GEMINI_API_KEY)

import base64

def build_structured_image_result(
    *,
    analysis: str,
    disease: str,
    prediction=None,
    probability: float | None = None,
    detected_class: str | None = None,
    model_missing: bool = False,
    note: str | None = None,
    error: str | None = None,
):
    risk_level = "Unknown"
    if probability is not None:
        if probability >= 0.7:
            risk_level = "High"
        elif probability >= 0.4:
            risk_level = "Moderate"
        else:
            risk_level = "Low"

    if isinstance(prediction, bool):
        prediction_label = "Positive" if prediction else "Negative"
    elif isinstance(prediction, str):
        prediction_label = prediction
    else:
        prediction_label = "Unknown"

    result = {
        "analysis": analysis,
        "disease": disease,
        "prediction": prediction,
        "prediction_label": prediction_label,
        "probability": probability,
        "risk_level": risk_level,
        "class": detected_class,
        "modelMissing": model_missing,
    }

    if note:
        result["note"] = note
    if error:
        result["error"] = error

    return result

def load_pytorch_model(model_name):
    """Load a PyTorch model from the saved_models directory"""
    try:
        if not TORCH_AVAILABLE:
            logger.warning(f"PyTorch is unavailable for {model_name}: {TORCH_IMPORT_ERROR}")
            return None, None

        model_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 
                               'saved_models', f'{model_name}_full.pth')
        
        # Check if model exists
        if not os.path.exists(model_path):
            logger.error(f"Model file not found: {model_path}")
            return None, None
            
        # Load model
        model = torch.load(model_path, map_location=torch.device('cpu'))
        model.eval()
        
        # Load class mapping
        class_mapping_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 
                                       'saved_models', f'{model_name}_classes.json')
        with open(class_mapping_path, 'r') as f:
            class_mapping = json.load(f)
            
        return model, class_mapping
    except Exception as e:
        logger.error(f"Error loading PyTorch model {model_name}: {str(e)}\n{traceback.format_exc()}")
        return None, None

async def process_image_for_disease(image_data: bytes, disease_type: str):
    """
    Process the uploaded image for the specific disease type
    """
    try:
        # Convert bytes to numpy array
        nparr = np.frombuffer(image_data, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        # Process image based on disease type
        if disease_type == "diabetes":
            return process_diabetes_image(img)
        elif disease_type == "heart":
            return process_heart_image(img)
        elif disease_type == "liver":
            return process_liver_image(img)
        elif disease_type == "lung":
            return process_lung_image(img)
        elif disease_type == "kidney":
            return process_kidney_image(img)
        elif disease_type == "parkinsons":
            return process_parkinsons_image(img)
        elif disease_type == "breast":
            return process_breast_cancer_image(img)
        elif disease_type == "breast_cancer":
            return process_breast_cancer_image(img)
        elif disease_type == "skin_cancer":
            return process_skin_cancer_image(img)
        elif disease_type == "brain_tumor":
            return process_brain_tumor_image(img)
        else:
            return process_general_disease_image(img)
    except Exception as e:
        logger.error(f"Error processing image: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Image processing error: {str(e)}")

def process_diabetes_image(img):
    """
    Process image for diabetes detection
    For now, we'll use Gemini API for analysis and return a placeholder result
    In a production environment, you would use a specific ML model for this
    """
    # Get detailed analysis from Gemini specifically for diabetes
    analysis = get_gemini_analysis(img, "diabetes", is_specific=True)
    
    # For image uploads, we only return the analysis, not predictions
    return build_structured_image_result(
        analysis=analysis,
        disease="Diabetes",
        prediction=None,
        probability=None,
    )

def process_heart_image(img):
    """Process image for heart disease detection"""
    # Placeholder values
    prediction = True
    probability = 0.65
    analysis = get_gemini_analysis(img, "heart disease")
    
    return build_structured_image_result(
        analysis=analysis,
        disease="Heart Disease",
        prediction=prediction,
        probability=probability,
    )

def process_liver_image(img):
    """Process image for liver disease detection"""
    # Placeholder values
    prediction = True
    probability = 0.72
    analysis = get_gemini_analysis(img, "liver disease")
    
    return build_structured_image_result(
        analysis=analysis,
        disease="Liver Disease",
        prediction=prediction,
        probability=probability,
    )

def process_lung_image(img):
    """Process image for lung cancer detection"""
    # Placeholder values
    prediction = False
    probability = 0.15
    analysis = get_gemini_analysis(img, "lung cancer")
    
    return build_structured_image_result(
        analysis=analysis,
        disease="Lung Cancer",
        prediction=prediction,
        probability=probability,
    )

def process_kidney_image(img):
    """Process image for chronic kidney disease detection"""
    # Placeholder values
    prediction = True
    probability = 0.83
    analysis = get_gemini_analysis(img, "chronic kidney disease")
    
    return build_structured_image_result(
        analysis=analysis,
        disease="Chronic Kidney Disease",
        prediction=prediction,
        probability=probability,
    )

def process_parkinsons_image(img):
    """Process image for Parkinson's disease detection"""
    # Placeholder values
    prediction = True
    probability = 0.91
    analysis = get_gemini_analysis(img, "Parkinson's disease")
    
    return build_structured_image_result(
        analysis=analysis,
        disease="Parkinson's Disease",
        prediction=prediction,
        probability=probability,
    )

def process_breast_cancer_image(img):
    """Process image for breast cancer detection using trained model"""
    try:
        if not TORCH_AVAILABLE or transforms is None:
            analysis = get_gemini_analysis(img, "breast cancer")
            return build_structured_image_result(
                analysis=analysis,
                disease="Breast Cancer Analysis",
                prediction="Model unavailable",
                probability=None,
                detected_class="Unknown",
                model_missing=True,
                note="PyTorch is not installed, so fallback analysis was used",
            )

        # Load model
        model, class_mapping = load_pytorch_model('breast_cancer')
        if model is None:
            # Fallback to Gemini API if model not found
            analysis = get_gemini_analysis(img, "breast cancer")
            return build_structured_image_result(
                analysis=analysis,
                disease="Breast Cancer Analysis",
                prediction="Model unavailable",
                probability=None,
                detected_class="Unknown",
                model_missing=True,
                note="Using fallback analysis as model could not be loaded",
            )
        
        # Preprocess image
        img = cv2.resize(img, (224, 224))
        img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        
        # Convert to PyTorch tensor
        transform = transforms.Compose([
            transforms.ToTensor(),
            transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
        ])
        
        # Convert numpy array to PIL Image
        pil_img = Image.fromarray(img)
        tensor_img = transform(pil_img).unsqueeze(0)
        
        # Make prediction
        with torch.no_grad():
            outputs = model(tensor_img)
            probs = torch.nn.functional.softmax(outputs, dim=1)
            predicted_class = torch.argmax(probs, dim=1).item()
            confidence = probs[0][predicted_class].item()
        
        # Get class name from mapping
        prediction = class_mapping.get(str(predicted_class), "Unknown")
        is_malignant = prediction == "MALIGNANT"
        
        # Get analysis from Gemini for additional context
        analysis = get_gemini_analysis(img, "breast cancer")
        
        return build_structured_image_result(
            analysis=analysis,
            disease="Breast Cancer",
            prediction=is_malignant,
            probability=float(confidence),
            detected_class=prediction,
        )
    except Exception as e:
        logger.error(f"Error in breast cancer image processing: {str(e)}\n{traceback.format_exc()}")
        # Fallback to Gemini API
        analysis = get_gemini_analysis(img, "breast cancer")
        return build_structured_image_result(
            analysis=analysis,
            disease="Breast Cancer Analysis",
            prediction="Model unavailable",
            probability=None,
            detected_class="Unknown",
            model_missing=True,
            error=str(e),
        )

def process_skin_cancer_image(img):
    """Process image for skin cancer detection using trained model"""
    try:
        if not TORCH_AVAILABLE or transforms is None:
            analysis = get_gemini_analysis(img, "skin cancer")
            return build_structured_image_result(
                analysis=analysis,
                disease="Skin Cancer Analysis",
                prediction="Model unavailable",
                probability=None,
                detected_class="Unknown",
                model_missing=True,
                note="PyTorch is not installed, so fallback analysis was used",
            )

        # Load model
        model, class_mapping = load_pytorch_model('skin_cancer')
        if model is None:
            # Fallback to Gemini API if model not found
            analysis = get_gemini_analysis(img, "skin cancer")
            return build_structured_image_result(
                analysis=analysis,
                disease="Skin Cancer Analysis",
                prediction="Model unavailable",
                probability=None,
                detected_class="Unknown",
                model_missing=True,
                note="Using fallback analysis as model could not be loaded",
            )
        
        # Preprocess image
        img = cv2.resize(img, (224, 224))
        img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        
        # Convert to PyTorch tensor
        transform = transforms.Compose([
            transforms.ToTensor(),
            transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
        ])
        
        # Convert numpy array to PIL Image
        pil_img = Image.fromarray(img)
        tensor_img = transform(pil_img).unsqueeze(0)
        
        # Make prediction
        with torch.no_grad():
            outputs = model(tensor_img)
            probs = torch.nn.functional.softmax(outputs, dim=1)
            predicted_class = torch.argmax(probs, dim=1).item()
            confidence = probs[0][predicted_class].item()
        
        # Get class name from mapping
        prediction = class_mapping.get(str(predicted_class), "Unknown")
        is_malignant = prediction == "MALIGNANT"
        
        # Get analysis from Gemini for additional context
        analysis = get_gemini_analysis(img, "skin cancer")
        
        return build_structured_image_result(
            analysis=analysis,
            disease="Skin Cancer",
            prediction=is_malignant,
            probability=float(confidence),
            detected_class=prediction,
        )
    except Exception as e:
        logger.error(f"Error in skin cancer image processing: {str(e)}\n{traceback.format_exc()}")
        # Fallback to Gemini API
        analysis = get_gemini_analysis(img, "skin cancer")
        return build_structured_image_result(
            analysis=analysis,
            disease="Skin Cancer Analysis",
            prediction="Model unavailable",
            probability=None,
            detected_class="Unknown",
            model_missing=True,
            error=str(e),
        )

def process_brain_tumor_image(img):
    """Process image for brain tumor detection using trained model"""
    try:
        if not TORCH_AVAILABLE or transforms is None:
            analysis = get_gemini_analysis(img, "brain tumor")
            return build_structured_image_result(
                analysis=analysis,
                disease="Brain Tumor Analysis",
                prediction="Model unavailable",
                probability=None,
                detected_class="Unknown",
                model_missing=True,
                note="PyTorch is not installed, so fallback analysis was used",
            )

        # Load model
        model, class_mapping = load_pytorch_model('brain_tumor')
        if model is None:
            # Fallback to Gemini API if model not found
            analysis = get_gemini_analysis(img, "brain tumor")
            return build_structured_image_result(
                analysis=analysis,
                disease="Brain Tumor Analysis",
                prediction="Model unavailable",
                probability=None,
                detected_class="Unknown",
                model_missing=True,
                note="Using fallback analysis as model could not be loaded",
            )
        
        # Preprocess image
        img = cv2.resize(img, (224, 224))
        img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        
        # Convert to PyTorch tensor
        transform = transforms.Compose([
            transforms.ToTensor(),
            transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
        ])
        
        # Convert numpy array to PIL Image
        pil_img = Image.fromarray(img)
        tensor_img = transform(pil_img).unsqueeze(0)
        
        # Make prediction
        with torch.no_grad():
            outputs = model(tensor_img)
            probs = torch.nn.functional.softmax(outputs, dim=1)
            predicted_class = torch.argmax(probs, dim=1).item()
            confidence = probs[0][predicted_class].item()
        
        # Get class name from mapping
        prediction = class_mapping.get(str(predicted_class), "Unknown")
        is_tumor = prediction == "TUMOR"
        
        # Get analysis from Gemini for additional context
        analysis = get_gemini_analysis(img, "brain tumor")
        
        return build_structured_image_result(
            analysis=analysis,
            disease="Brain Tumor",
            prediction=is_tumor,
            probability=float(confidence),
            detected_class=prediction,
        )
    except Exception as e:
        logger.error(f"Error in brain tumor image processing: {str(e)}\n{traceback.format_exc()}")
        # Fallback to Gemini API
        analysis = get_gemini_analysis(img, "brain tumor")
        return build_structured_image_result(
            analysis=analysis,
            disease="Brain Tumor Analysis",
            prediction="Model unavailable",
            probability=None,
            detected_class="Unknown",
            model_missing=True,
            error=str(e),
        )

def process_general_disease_image(img):
    """Process image for general disease detection"""
    # Placeholder values
    disease = "Common Cold"
    probability = 0.75
    description = "The common cold is a viral infection of your nose and throat (upper respiratory tract)."
    precautions = [
        "Rest and stay hydrated",
        "Use over-the-counter medications to manage symptoms",
        "Wash hands frequently",
        "Avoid close contact with others"
    ]
    analysis = get_gemini_analysis(img, "general disease symptoms")
    
    result = build_structured_image_result(
        analysis=analysis,
        disease=disease,
        prediction=disease,
        probability=probability,
    )
    result["description"] = description
    result["precautions"] = precautions
    return result

def get_gemini_analysis(img, disease_type: str, is_specific: bool = False) -> str:
    """
    Get detailed analysis from Google's Gemini API
    """
    if not GEMINI_API_KEY:
        return "API key not configured. Please set up your Gemini API key to get detailed analysis."
    
    try:
        # Convert image to base64
        _, buffer = cv2.imencode('.jpg', img)
        img_base64 = base64.b64encode(buffer).decode('utf-8')
        
        # Prepare the request for Gemini API
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={GEMINI_API_KEY}"
        
        prompt_text = ""
        if is_specific and disease_type == "diabetes":
            prompt_text = (
                "Analyze this image for diabetes-related information. "
                "First, determine if this is: (1) a medical image showing physical symptoms of diabetes, "
                "(2) a diabetes report/document, or (3) an unrelated image. "
                
                "If it's a MEDICAL IMAGE showing physical symptoms (like diabetic foot ulcers, retinopathy, etc.):"
                "- Start with 'MEDICAL IMAGE: This shows diabetes-related symptoms'"
                "- Analyze visible symptoms"
                "- Provide severity assessment"
                
                "If it's a DIABETES REPORT/DOCUMENT:"
                "- Start with 'DIABETES REPORT: This is a medical document'"
                "- Extract key metrics (glucose levels, HbA1c, etc.)"
                "- State clearly if diabetes is present based on the report values"
                "- Provide probability percentage if available"
                "- List any concerning values in bullet points"
                
                "If it's an UNRELATED IMAGE:"
                "- Start with 'UNRELATED IMAGE: This image does not show diabetes-related conditions'"
                "- Briefly explain why"
                
                "Format your response with these sections:"
                "1. Classification (what type of image this is)"
                "2. Key Findings (metrics or symptoms)"
                "3. Recommendations"
                
                "Keep your response concise and avoid markdown formatting."
            )
        else:
            prompt_text = f"Analyze this medical image for signs of {disease_type}. Provide a detailed assessment including potential indicators, severity if applicable, and recommendations. Format your response in a clear, structured way suitable for a medical application."
        
        payload = {
            "contents": [
                {
                    "parts": [
                        {"text": prompt_text},
                        {
                            "inline_data": {
                                "mime_type": "image/jpeg",
                                "data": img_base64
                            }
                        }
                    ]
                }
            ],
            "generation_config": {
                "temperature": 0.4,
                "top_p": 0.95,
                "max_output_tokens": 800
            }
        }
        
        response = requests.post(url, json=payload)
        
        if response.status_code == 200:
            result = response.json()
            # Extract the text from the response
            if 'candidates' in result and len(result['candidates']) > 0:
                if 'content' in result['candidates'][0] and 'parts' in result['candidates'][0]['content']:
                    for part in result['candidates'][0]['content']['parts']:
                        if 'text' in part:
                            return part['text']
            
            return "Analysis not available"
        else:
            logger.error(f"Gemini API error: {response.status_code} - {response.text}")
            return f"Unable to get analysis. API error: {response.status_code}"
            
    except Exception as e:
        logger.error(f"Error in Gemini analysis: {str(e)}")
        return "Error generating analysis"

@router.post("/{disease_type}")
async def upload_image(disease_type: str, file: UploadFile = File(...)):
    """
    Endpoint to upload and process an image for disease detection
    """
    try:
        # Validate file type
        if not file.content_type.startswith('image/'):
            raise HTTPException(status_code=400, detail="File must be an image")
        
        # Read file content
        contents = await file.read()
        
        # Process the image
        result = await process_image_for_disease(contents, disease_type)
        
        return result
    
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Error processing upload: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Error processing upload: {str(e)}")
