import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/utils/supabase';
import { detectAppointmentRequest, analyzeImage, checkAgentRedirect } from '@/utils/chatUtils';

// Mock AI responses for different agent types
const agentResponses: Record<string, string[]> = {
  general: [
    "Based on your symptoms, I recommend getting plenty of rest and staying hydrated. If symptoms persist for more than 3 days, please consult a doctor.",
    "Your health metrics look good! Remember to maintain a balanced diet and regular exercise routine.",
    "I've analyzed your information. It's important to maintain regular check-ups with your healthcare provider."
  ],
  menstrual: [
    "I've noted your cycle start date. I'll send you reminders 2 days before your next expected period.",
    "Based on your cycle history, your next period is expected around May 5th. Would you like me to set up a reminder?",
    "I've updated your menstrual cycle data. Your average cycle length is 28 days with a standard deviation of 2 days."
  ],
  nutrition: [
    "Based on your food log, you're getting adequate protein but could use more leafy greens. Try adding spinach or kale to your meals.",
    "Your current caloric intake is within the recommended range. Consider increasing your water intake to 8-10 glasses daily.",
    "I notice you've been consistent with your meal timing. That's excellent for metabolic health!"
  ],
  exercise: [
    "Great job on your workout streak! I recommend adding some strength training to complement your cardio routine.",
    "Based on your activity level, aim for 150-300 minutes of moderate exercise per week. You're currently at 120 minutes.",
    "Your heart rate recovery has improved by 10% since last month. Keep up the good work!"
  ],
  medication: [
    "I've set a reminder for your medication at 8:00 AM and 8:00 PM daily.",
    "Your prescription will run out in 5 days. Would you like me to send a reminder to refill it?",
    "I've noted your new medication schedule. I'll send notifications according to the prescribed timing."
  ],
  appointment: [
    "Your appointment with Dr. Johnson is scheduled for May 10th at 2:30 PM. I'll send a reminder 24 hours before.",
    "Based on your health profile, it's time for your annual check-up. Would you like me to suggest available doctors?",
    "I've added your upcoming appointment to your health calendar. You'll receive a notification on the day."
  ],
  respiratory: [
    "Your breathing pattern data shows improvement. Continue with the prescribed inhaler regimen.",
    "Air quality in your area is poor today. Consider limiting outdoor activities if you experience any respiratory discomfort.",
    "Based on your symptoms, monitor your peak flow readings twice daily and record them for your doctor."
  ]
};

// Helper function to get random response
function getRandomResponse(agentId: string): string {
  const responses = agentResponses[agentId] || agentResponses.general;
  return responses[Math.floor(Math.random() * responses.length)];
}

// Define notification info type
interface NotificationInfo {
  type: string;
  daysAhead?: number;
  hoursAhead?: number;
}

// Define notification trigger result type
interface NotificationTrigger {
  type: string;
  scheduledTime: string;
  message: string;
}

// Helper function to check if message needs a notification
function checkForNotificationTrigger(message: string, agentId: string): NotificationTrigger | null {
  // Check for keywords that might trigger notifications
  const keywords: Record<string, Record<string, NotificationInfo>> = {
    menstrual: {
      'period': { type: 'menstrual_reminder', daysAhead: 2 },
      'cycle': { type: 'menstrual_reminder', daysAhead: 2 },
      'menstrual': { type: 'menstrual_reminder', daysAhead: 2 },
      'track': { type: 'menstrual_reminder', daysAhead: 2 }
    },
    medication: {
      'medicine': { type: 'medication_reminder', hoursAhead: 1 },
      'pill': { type: 'medication_reminder', hoursAhead: 1 },
      'medication': { type: 'medication_reminder', hoursAhead: 1 },
      'remind': { type: 'medication_reminder', hoursAhead: 1 }
    },
    appointment: {
      'appointment': { type: 'appointment_reminder', hoursAhead: 24 },
      'doctor': { type: 'appointment_reminder', hoursAhead: 24 },
      'schedule': { type: 'appointment_reminder', hoursAhead: 24 },
      'visit': { type: 'appointment_reminder', hoursAhead: 24 }
    },
    exercise: {
      'workout': { type: 'exercise_reminder', hoursAhead: 1 },
      'exercise': { type: 'exercise_reminder', hoursAhead: 1 },
      'fitness': { type: 'exercise_reminder', hoursAhead: 1 },
      'training': { type: 'exercise_reminder', hoursAhead: 1 }
    }
  };
  
  const agentKeywords = keywords[agentId];
  if (!agentKeywords) return null;
  
  const lowerMessage = message.toLowerCase();
  
  for (const [keyword, notificationInfo] of Object.entries(agentKeywords)) {
    if (lowerMessage.includes(keyword)) {
      // Calculate scheduled time
      const now = new Date();
      let scheduledTime = new Date();
      
      if (notificationInfo.daysAhead) {
        scheduledTime.setDate(now.getDate() + notificationInfo.daysAhead);
        scheduledTime.setHours(9, 0, 0, 0); // 9:00 AM
      } else if (notificationInfo.hoursAhead) {
        scheduledTime.setHours(now.getHours() + notificationInfo.hoursAhead);
      }
      
      return {
        type: notificationInfo.type,
        scheduledTime: scheduledTime.toISOString(),
        message: generateNotificationMessage(notificationInfo.type)
      };
    }
  }
  
  return null;
}

// Generate notification message
function generateNotificationMessage(type: string): string {
  const messages: Record<string, string[]> = {
    menstrual_reminder: [
      "Reminder: Your period is expected to start in 2 days.",
      "Menstrual cycle update: Your next period is approaching in 2 days.",
      "Health alert: Prepare for your upcoming period in 2 days."
    ],
    medication_reminder: [
      "Time to take your medication!",
      "Medication reminder: Don't forget your scheduled dose.",
      "Health reminder: It's time for your medication."
    ],
    appointment_reminder: [
      "You have a doctor's appointment tomorrow.",
      "Appointment reminder: Don't forget your scheduled visit tomorrow.",
      "Health reminder: Your doctor's appointment is coming up tomorrow."
    ],
    exercise_reminder: [
      "Time for your workout session!",
      "Fitness reminder: Your scheduled exercise time is now.",
      "Health alert: Don't forget your planned workout."
    ]
  };
  
  const typeMessages = messages[type] || ["Reminder from your Health Assistant"];
  return typeMessages[Math.floor(Math.random() * typeMessages.length)];
}

export async function POST(request: NextRequest) {
  try {
    const { message, agentId, userId, imageUrl } = await request.json();
    
    // Store the user message in Supabase
    await supabase.from('chat_messages').insert({
      user_id: userId,
      message: message,
      agent_id: agentId,
      sender: 'user',
      image_url: imageUrl || null
    });
    
    // Initialize response data
    let aiResponse = '';
    let appointmentData = null;
    let redirectInfo = null;
    let imageAnalysisResult = null;
    
    // Check if this is an appointment booking request
    const appointmentRequest = detectAppointmentRequest(message);
    
    if (appointmentRequest.isAppointment && agentId === 'appointment') {
      // Handle appointment booking
      appointmentData = {
        doctorName: appointmentRequest.doctorName || 'Unknown Doctor',
        date: appointmentRequest.date || new Date().toISOString().split('T')[0],
        time: appointmentRequest.time || '10:00'
      };
      
      aiResponse = `I've prepared an appointment booking for you with ${appointmentData.doctorName} on ${new Date(appointmentData.date).toLocaleDateString()} at ${appointmentData.time}. Please confirm if you'd like to proceed.`;
    } 
    // Check if we should redirect to another agent
    else if (message.trim()) {
      const redirect = checkAgentRedirect(message, agentId);
      
      if (redirect.shouldRedirect && redirect.targetAgentId) {
        redirectInfo = {
          targetAgentId: redirect.targetAgentId,
          reason: redirect.reason
        };
        
        aiResponse = redirect.reason || `This question might be better answered by our ${redirect.targetAgentId.replace(/^\w/, c => c.toUpperCase())} assistant.`;
      } else {
        // Generate standard AI response
        aiResponse = getRandomResponse(agentId);
      }
    }
    // Handle image analysis if there's an image but no text
    else if (imageUrl && !message.trim()) {
      // Analyze the image based on the agent type
      imageAnalysisResult = await analyzeImage(imageUrl, agentId);
      aiResponse = imageAnalysisResult;
    }
    // Default response if none of the above
    else {
      aiResponse = getRandomResponse(agentId);
    }
    
    // Check if we need to schedule a notification
    const notificationData = checkForNotificationTrigger(message, agentId);
    
    // Store the AI response in Supabase
    await supabase.from('chat_messages').insert({
      user_id: userId,
      message: aiResponse,
      agent_id: agentId,
      sender: 'ai'
    });
    
    // Return the response with all the data
    return NextResponse.json({ 
      success: true, 
      message: aiResponse,
      notification: notificationData,
      appointment: appointmentData,
      redirect: redirectInfo,
      imageAnalysis: imageAnalysisResult
    });
    
  } catch (error) {
    console.error('Error processing chat message:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Failed to process your message' 
    }, { status: 500 });
  }
}
