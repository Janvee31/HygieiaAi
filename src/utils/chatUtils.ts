// Utility functions for the chat AI functionality

// Function to detect appointment booking requests
export const detectAppointmentRequest = (message: string): { 
  isAppointment: boolean; 
  doctorName?: string; 
  date?: string; 
  time?: string;
} => {
  const lowerMessage = message.toLowerCase();
  
  // Check if message contains appointment booking keywords
  const appointmentKeywords = ['book', 'appointment', 'schedule', 'slot', 'doctor', 'dr.', 'dr'];
  const hasAppointmentKeywords = appointmentKeywords.some(keyword => lowerMessage.includes(keyword));
  
  if (!hasAppointmentKeywords) {
    return { isAppointment: false };
  }
  
  // Extract doctor name
  // Look for patterns like "Dr. Name" or "doctor Name"
  let doctorName: string | undefined;
  const drRegex = /dr\.?\s+([a-z]+\s+[a-z]+)/i;
  const doctorRegex = /doctor\s+([a-z]+\s+[a-z]+)/i;
  
  const drMatch = message.match(drRegex);
  const doctorMatch = message.match(doctorRegex);
  
  if (drMatch && drMatch[1]) {
    doctorName = drMatch[1];
  } else if (doctorMatch && doctorMatch[1]) {
    doctorName = doctorMatch[1];
  }
  
  // Extract date
  // Look for dates in formats like "on 24th April" or "on April 24"
  let date: string | undefined;
  const dateRegex1 = /on\s+(\d+)(st|nd|rd|th)?\s+(january|february|march|april|may|june|july|august|september|october|november|december)/i;
  const dateRegex2 = /on\s+(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d+)(st|nd|rd|th)?/i;
  
  const dateMatch1 = message.match(dateRegex1);
  const dateMatch2 = message.match(dateRegex2);
  
  if (dateMatch1 && dateMatch1[1] && dateMatch1[3]) {
    const day = parseInt(dateMatch1[1]);
    const month = dateMatch1[3].toLowerCase();
    const year = new Date().getFullYear();
    date = `${year}-${getMonthNumber(month)}-${day.toString().padStart(2, '0')}`;
  } else if (dateMatch2 && dateMatch2[1] && dateMatch2[2]) {
    const day = parseInt(dateMatch2[2]);
    const month = dateMatch2[1].toLowerCase();
    const year = new Date().getFullYear();
    date = `${year}-${getMonthNumber(month)}-${day.toString().padStart(2, '0')}`;
  }
  
  // Extract time
  // Look for time patterns like "at 10 am" or "at 10:30 am"
  let time: string | undefined;
  const timeRegex = /at\s+(\d+)(?::(\d+))?\s*(am|pm)/i;
  
  const timeMatch = message.match(timeRegex);
  
  if (timeMatch && timeMatch[1]) {
    let hours = parseInt(timeMatch[1]);
    const minutes = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
    const period = timeMatch[3].toLowerCase();
    
    // Convert to 24-hour format
    if (period === 'pm' && hours < 12) {
      hours += 12;
    } else if (period === 'am' && hours === 12) {
      hours = 0;
    }
    
    time = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }
  
  return {
    isAppointment: true,
    doctorName,
    date,
    time
  };
};

// Helper function to convert month name to number
const getMonthNumber = (monthName: string): string => {
  const months: Record<string, string> = {
    'january': '01',
    'february': '02',
    'march': '03',
    'april': '04',
    'may': '05',
    'june': '06',
    'july': '07',
    'august': '08',
    'september': '09',
    'october': '10',
    'november': '11',
    'december': '12'
  };
  
  return months[monthName] || '01';
};

// Import Gemini image analysis function
import { generateGeminiImageAnalysis } from './geminiAI';

// Function to analyze image content and return appropriate response using Gemini
export const analyzeImage = async (imageUrl: string, agentId: string): Promise<string> => {
  try {
    // Convert image URL to base64 if needed
    let base64Image = imageUrl;
    
    // If the URL is a remote URL and not a base64 string, fetch and convert it
    if (imageUrl.startsWith('http') && !imageUrl.startsWith('data:')) {
      const response = await fetch(imageUrl);
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      base64Image = `data:image/jpeg;base64,${buffer.toString('base64')}`;
    }
    
    // Create a prompt based on the agent type
    let prompt = '';
    
    switch (agentId) {
      case 'general':
        prompt = 'Analyze this medical image and provide a general health assessment. Identify any visible health issues, potential concerns, and suggest next steps. Be thorough but accessible in your explanation.';
        break;
      
      case 'respiratory':
        prompt = 'Analyze this image from a respiratory health perspective. If it appears to be a medical scan, describe what you see but emphasize the importance of professional interpretation. Suggest relevant next steps or questions the user should consider.';
        break;
      
      case 'nutrition':
        prompt = 'Analyze the food items in this image. Provide an approximate calorie count, nutritional breakdown, and suggestions for improving the nutritional balance if needed. Consider portion sizes, food groups, and overall meal composition.';
        break;
      
      default:
        prompt = 'Analyze this image and provide health-related insights. Identify any visible health concerns, nutritional information, or medical data that might be present. Provide helpful context and next steps.';
    }
    
    // Use Gemini to analyze the image
    const analysis = await generateGeminiImageAnalysis(prompt, base64Image);
    return analysis;
    
  } catch (error) {
    console.error('Error analyzing image:', error);
    return "I'm sorry, but I encountered an error while analyzing your image. Please try again or consider uploading a different image.";
  }
};

// Function to check if a message should be redirected to another agent
export interface RedirectInfo {
  shouldRedirect: boolean;
  targetAgentId?: string;
  reason?: string;
}

// Function to detect if a message should be redirected to another agent
export const detectAgentRedirect = (message: string, currentAgentId: string): string | null => {
  const redirectInfo = checkAgentRedirect(message, currentAgentId);
  return redirectInfo.shouldRedirect ? redirectInfo.targetAgentId || null : null;
};

export const checkAgentRedirect = (message: string, currentAgentId: string): RedirectInfo => {
  const lowerMessage = message.toLowerCase();
  
  // Keywords that indicate topics for specific agents
  const agentKeywords: Record<string, string[]> = {
    'general': ['health', 'sick', 'fever', 'cold', 'flu', 'pain', 'doctor'],
    'menstrual': ['period', 'menstrual', 'cycle', 'ovulation', 'pms', 'cramps'],
    'nutrition': ['food', 'diet', 'meal', 'nutrition', 'eat', 'calorie', 'weight', 'protein', 'carb'],
    'exercise': ['workout', 'exercise', 'fitness', 'run', 'gym', 'training', 'cardio', 'strength'],
    'medication': ['medicine', 'drug', 'pill', 'prescription', 'dose', 'medication'],
    'appointment': ['appointment', 'schedule', 'book', 'doctor', 'visit', 'consultation'],
    'respiratory': ['breath', 'lung', 'asthma', 'inhaler', 'respiratory', 'oxygen', 'cough']
  };
  
  // Don't redirect if already in general health
  if (currentAgentId === 'general') {
    return { shouldRedirect: false };
  }
  
  // Check if message contains keywords for other agents
  for (const [agentId, keywords] of Object.entries(agentKeywords)) {
    // Skip the current agent
    if (agentId === currentAgentId) continue;
    
    // Check if message contains keywords for this agent
    const hasKeywords = keywords.some(keyword => lowerMessage.includes(keyword));
    
    if (hasKeywords) {
      return {
        shouldRedirect: true,
        targetAgentId: agentId,
        reason: `This question seems to be about ${agentId.replace(/^\w/, c => c.toUpperCase())} topics. Would you like me to switch to the ${agentId.replace(/^\w/, c => c.toUpperCase())} assistant?`
      };
    }
  }
  
  return { shouldRedirect: false };
};
