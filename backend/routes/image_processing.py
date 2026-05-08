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

# PyTorch dependency removed - all image analysis is now Gemini-powered

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
    risk_level_override: str | None = None,
    note: str | None = None,
    error: str | None = None,
):
    # Use explicit risk level if provided, otherwise calculate from probability
    if risk_level_override and risk_level_override in ("Low", "Moderate", "High"):
        risk_level = risk_level_override
    elif probability is not None:
        if probability >= 0.7:
            risk_level = "High"
        elif probability >= 0.4:
            risk_level = "Moderate"
        else:
            risk_level = "Low"
    else:
        risk_level = "Unknown"

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
    }

    if note:
        result["note"] = note
    if error:
        result["error"] = error

    return result

# load_pytorch_model removed - all image analysis is now Gemini-powered

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
        elif disease_type == "skin_cancer":
            return process_skin_cancer_image(img)
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


def process_skin_cancer_image(img):
    """Process image for skin cancer detection using Gemini AI analysis"""
    try:
        # Use a structured prompt so we can parse confidence, risk, and type
        analysis = get_gemini_analysis(img, "skin cancer", is_specific=True)

        # Parse structured fields from the analysis text
        confidence = _extract_confidence(analysis)
        risk_level = _extract_risk_level(analysis)
        lesion_type = _extract_lesion_type(analysis)
        is_positive = _extract_prediction(analysis)

        # Use the specific lesion type as the disease name when available
        disease_name = lesion_type if lesion_type and lesion_type != "Skin Lesion" else "Skin Cancer"

        return build_structured_image_result(
            analysis=analysis,
            disease=disease_name,
            prediction=is_positive,
            probability=confidence,
            detected_class=lesion_type,
            risk_level_override=risk_level,
        )
    except Exception as e:
        logger.error(f"Error in skin cancer image processing: {str(e)}\n{traceback.format_exc()}")
        return build_structured_image_result(
            analysis="Error generating analysis. Please try again.",
            disease="Skin Cancer",
            prediction=None,
            probability=None,
            error=str(e),
        )


# ── Helpers to extract structured fields from Gemini text ──────────────

import re

def _extract_confidence(text: str) -> float | None:
    """Extract confidence percentage from analysis text (e.g. '85%', 'Confidence: 72%')."""
    # Look for "Confidence: XX%" pattern first
    m = re.search(r'[Cc]onfidence[:\s]*(\d{1,3})(?:\.\d+)?%', text)
    if m:
        return min(int(m.group(1)), 100) / 100.0
    # Fall back to any percentage near confidence-related keywords
    m = re.search(r'(\d{1,3})(?:\.\d+)?%\s*(?:confidence|certain|probability|likelihood)', text, re.IGNORECASE)
    if m:
        return min(int(m.group(1)), 100) / 100.0
    # Fall back to any standalone percentage
    matches = re.findall(r'(\d{1,3})(?:\.\d+)?%', text)
    if matches:
        val = max(int(x) for x in matches)
        return min(val, 100) / 100.0
    return 0.5  # default moderate confidence


def _extract_risk_level(text: str) -> str:
    """Extract risk level: Low, Moderate, or High."""
    lower = text.lower()
    # Check for explicit risk level mentions
    if re.search(r'risk\s*(?:level)?[:\s]*high|high[\s-]*risk|severe|critical', lower):
        return "High"
    if re.search(r'risk\s*(?:level)?[:\s]*moderate|moderate[\s-]*risk|medium[\s-]*risk', lower):
        return "Moderate"
    if re.search(r'risk\s*(?:level)?[:\s]*low|low[\s-]*risk|minimal[\s-]*risk|benign', lower):
        return "Low"
    # If malignant is mentioned, default to High
    if 'malignant' in lower or 'melanoma' in lower:
        return "High"
    if 'benign' in lower:
        return "Low"
    return "Moderate"


def _extract_lesion_type(text: str) -> str | None:
    """Extract specific lesion/cancer type from analysis text."""
    lower = text.lower()
    known_types = [
        ("melanoma", "Melanoma"),
        ("basal cell carcinoma", "Basal Cell Carcinoma"),
        ("squamous cell carcinoma", "Squamous Cell Carcinoma"),
        ("actinic keratosis", "Actinic Keratosis"),
        ("seborrheic keratosis", "Seborrheic Keratosis"),
        ("dermatofibroma", "Dermatofibroma"),
        ("nevus", "Melanocytic Nevus"),
        ("vascular lesion", "Vascular Lesion"),
        ("benign keratosis", "Benign Keratosis"),
        ("normal skin", "Normal Skin"),
    ]
    for pattern, label in known_types:
        if pattern in lower:
            return label
    return "Skin Lesion"


def _extract_prediction(text: str) -> bool:
    """Determine if the analysis indicates a positive (malignant/concerning) finding."""
    lower = text.lower()
    negative_indicators = ['benign', 'non-cancerous', 'no signs of cancer', 'no malignancy',
                          'not cancerous', 'no evidence of cancer', 'unlikely to be cancerous',
                          'no indication of skin cancer']
    positive_indicators = ['malignant', 'cancerous', 'melanoma', 'carcinoma',
                          'signs of cancer', 'suspicious', 'concerning', 'precancerous',
                          'potentially malignant']
    pos_count = sum(1 for p in positive_indicators if p in lower)
    neg_count = sum(1 for n in negative_indicators if n in lower)
    return pos_count > neg_count

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
        if is_specific and disease_type == "skin cancer":
            prompt_text = (
                "You are a dermatology AI assistant. Analyze this skin image for signs of skin cancer or lesions.\n\n"
                "You MUST include ALL of the following labeled fields in your response, each on its own line:\n\n"
                "Confidence: <number>%\n"
                "Risk Level: <Low or Moderate or High>\n"
                "Lesion Type: <specific type, e.g. Melanoma, Basal Cell Carcinoma, Squamous Cell Carcinoma, Actinic Keratosis, Seborrheic Keratosis, Melanocytic Nevus, Dermatofibroma, Benign Keratosis, Vascular Lesion, or Normal Skin>\n"
                "Prediction: <Positive or Negative> (Positive means signs of cancer/malignancy detected, Negative means benign/no cancer)\n\n"
                "After these fields, provide:\n"
                "1. Detailed Analysis: Describe all visible features, color, border irregularity, asymmetry, diameter, and any other ABCDE criteria observations.\n"
                "2. Recommendations: Suggest next steps (biopsy, dermatologist visit, monitoring, etc.).\n"
                "3. Precautions: Lifestyle and prevention tips.\n\n"
                "Be honest about your confidence level. If the image is unclear or not a skin image, set Confidence low and explain why.\n"
                "Do NOT use markdown formatting (no **, no ##, no bullet points with *)."
            )
        elif is_specific and disease_type == "diabetes":
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
