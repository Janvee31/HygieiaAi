/**
 * AI Response Generator
 * Provides contextual responses based on user input and selected agent
 */

import { generateGeminiResponse, generateGeminiImageAnalysis } from './geminiAI';
import { processMenstrualRequest } from './menstrualTracker';
import { processAppointmentRequest } from './appointmentHandler';
import { sendAppointmentConfirmation } from './notificationService';

export const generateAIResponse = async (
  userInput: string,
  agentId: string,
  imageUrl?: string,
  userId?: string,
  phoneNumber?: string
): Promise<{
  text: string;
  bookingUrl?: string;
  menstrualData?: any;
  appointmentData?: any;
}> => {
  if (!userInput || userInput.trim() === '') {
    return {
      text: getAgentIntroduction(agentId)
    };
  }

  try {
    if (agentId === 'menstrual' && userId) {
      const menstrualResponse = await processMenstrualRequest(userInput, userId);
      return {
        text: menstrualResponse.response,
        menstrualData: menstrualResponse.menstrualData || menstrualResponse.prediction
      };
    }

    if (agentId === 'appointment') {
      const appointmentResponse = await processAppointmentRequest(userInput);

      if (
        appointmentResponse.appointmentDetails &&
        appointmentResponse.appointmentDetails.doctorId &&
        appointmentResponse.appointmentDetails.date &&
        appointmentResponse.appointmentDetails.time &&
        phoneNumber
      ) {
        await sendAppointmentConfirmation({
          doctorId: appointmentResponse.appointmentDetails.doctorId,
          doctorName: appointmentResponse.appointmentDetails.doctorName || '',
          date: appointmentResponse.appointmentDetails.date,
          time: appointmentResponse.appointmentDetails.time,
          patientName: 'Patient',
          patientEmail: 'patient@example.com',
          patientPhone: phoneNumber,
          reason: appointmentResponse.appointmentDetails.reason,
          fees: 500
        });
      }

      return {
        text: appointmentResponse.response,
        bookingUrl: appointmentResponse.bookingUrl,
        appointmentData: appointmentResponse.appointmentDetails
      };
    }

    const context = buildPromptContext(agentId, userInput, imageUrl);
    const response = imageUrl
      ? await generateGeminiImageAnalysis(buildImagePrompt(agentId, userInput), imageUrl)
      : await generateGeminiResponse(userInput, context);

    return { text: response };
  } catch (error) {
    console.error('Error generating AI response:', error);
    return {
      text: 'I apologize, but I encountered an error while processing your request. Please try again or contact our support team for assistance.'
    };
  }
};

const getAgentRole = (agentId: string): string => {
  switch (agentId) {
    case 'general':
      return 'General Health Expert';
    case 'nutrition':
      return 'Nutrition Coach';
    case 'exercise':
      return 'Exercise Guide';
    case 'menstrual':
      return 'Menstrual Health Specialist with Ayurvedic expertise';
    case 'medication':
      return 'Medication Reminder Assistant';
    case 'appointment':
      return 'Appointment Manager';
    default:
      return 'Health Assistant';
  }
};

const getAgentIntroduction = (agentId: string): string => {
  switch (agentId) {
    case 'general':
      return "I'm here to help with your general health questions and concerns. Could you please be more specific about what health information you're looking for? I can provide wellness advice, symptom checking, or health tracking.";
    case 'nutrition':
      return 'I can analyze your diet, provide personalized nutrition recommendations, track calorie intake, and suggest meal plans based on your health goals. Tell me what you eat or what goal you want to achieve.';
    case 'exercise':
      return 'I can help you create a fitness routine, recommend exercises based on your goals, track your progress, and provide motivation. What are your fitness goals or what type of workout are you interested in?';
    case 'menstrual':
      return 'I can help you track and understand your menstrual cycle using Ayurvedic principles. Would you like to log your current cycle, view predictions, or learn about Ayurvedic approaches to menstrual health?';
    case 'medication':
      return 'I can help you manage medicines, reminders, schedules, and general medication safety questions. Tell me the medicine name, dose, and timing you want help organizing.';
    case 'appointment':
      return "I can help you schedule appointments with doctors, manage your bookings, and handle the payment process. Just let me know which doctor you'd like to see, along with your preferred date and time.";
    default:
      return "I'm here to assist with your health and wellness needs. How can I help you today?";
  }
};

const buildPromptContext = (agentId: string, userInput: string, imageUrl?: string): string => {
  const agentRole = getAgentRole(agentId);
  let context = `You are a ${agentRole} in the Hygieia Health Assistant application. Your responses should be clean, professional, and free of special characters or markdown formatting. Do not include disclaimers about being an AI. `;

  switch (agentId) {
    case 'general':
      context += 'You provide evidence-based health information, symptom assessment, and wellness advice. You should be informative but always recommend consulting healthcare professionals for diagnosis and treatment.';
      break;
    case 'nutrition':
      context += 'You provide personalized nutrition advice based on dietary science. You can analyze food choices, suggest meal plans, and explain nutritional concepts. Focus on balanced, sustainable eating habits rather than restrictive diets.';
      break;
    case 'exercise':
      context += "You create personalized exercise recommendations and workout plans. Consider the user's fitness level, goals, and any limitations. Emphasize safety and proper form.";
      break;
    case 'menstrual':
      context += 'You help track menstrual cycles and provide Ayurvedic insights for menstrual health. You can predict cycle dates, suggest natural remedies for symptoms, and explain the connection between doshas and menstrual patterns.';
      break;
    case 'medication':
      context += 'You help users organize medication schedules, reminders, and adherence. You can explain common use patterns and safety considerations, but you should avoid inventing prescriptions or changing doctor-prescribed dosing.';
      break;
    case 'appointment':
      context += "You help users book appointments with doctors. When a user requests an appointment, respond that you'll help them book it and ask them to confirm the details.";
      break;
  }

  if (imageUrl) {
    context += ' The user has shared an image which appears to be health-related. Analyze the visible information and provide relevant insights while acknowledging limitations.';
  }

  return context;
};

const buildImagePrompt = (agentId: string, userInput: string): string => {
  switch (agentId) {
    case 'nutrition':
      return `Analyze this food or meal image. Estimate nutritional balance, major food groups, calorie range, and suggest healthier improvements if needed. User context: ${userInput || 'No extra context provided.'}`;
    case 'exercise':
      return `Analyze this fitness-related image and provide safe exercise or posture-related guidance if applicable. If it is not exercise-related, say that clearly. User context: ${userInput || 'No extra context provided.'}`;
    case 'medication':
      return `Analyze this medicine, prescription, or health-related image. Identify visible medication or label details if possible, and explain them carefully. If anything is unclear, say so clearly. User context: ${userInput || 'No extra context provided.'}`;
    case 'appointment':
      return `Analyze this health-related image and summarize anything useful for an appointment or consultation. User context: ${userInput || 'No extra context provided.'}`;
    case 'menstrual':
      return `Analyze this health-related image only if it is relevant to menstrual health, symptoms, or reports. If it is unrelated, say that clearly. User context: ${userInput || 'No extra context provided.'}`;
    default:
      return `Analyze this health-related image and provide useful medical or wellness insights in clear language. User context: ${userInput || 'No extra context provided.'}`;
  }
};
