/**
 * Notification Service for Hygieia Health Assistant
 * Handles SMS notifications via Twilio for appointments, menstrual tracking, and other alerts
 */

import { supabase } from './supabase';

// Twilio configuration
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER;

// Interface for notification data
export interface NotificationData {
  userId: string;
  phone: string;
  message: string;
  scheduledTime: string;
  type: 'appointment' | 'menstrual' | 'medication' | 'general';
  metadata?: Record<string, any>;
  sent?: boolean;
}

/**
 * Schedule a notification to be sent at a specific time
 * @param data The notification data
 * @returns Success status
 */
export const scheduleNotification = async (data: NotificationData): Promise<boolean> => {
  try {
    if (!data.phone || !data.message || !data.scheduledTime) {
      console.error('Missing required notification data');
      return false;
    }
    
    // In development/testing mode, skip database operations and use mock service
    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
      console.log('📅 MOCK NOTIFICATION SCHEDULED:', {
        phone: data.phone,
        message: data.message,
        scheduledTime: data.scheduledTime,
        type: data.type
      });
      
      // Send the mock SMS immediately for testing
      return await sendSMS(data.phone, data.message);
    }
    
    // For production with real Twilio credentials, store in database
    try {
      const { error } = await supabase
        .from('notifications')
        .insert([{
          user_id: data.userId,
          phone: data.phone,
          message: data.message,
          scheduled_time: data.scheduledTime,
          type: data.type,
          metadata: data.metadata || {},
          sent: false
        }]);
      
      if (error) {
        console.error('Database error scheduling notification:', error);
        // Even if database fails, try to send the SMS directly
        return await sendSMS(data.phone, data.message);
      }
      
      return true;
    } catch (dbError) {
      console.error('Database operation failed:', dbError);
      // Fall back to direct SMS if database fails
      return await sendSMS(data.phone, data.message);
    }
  } catch (error) {
    console.error('Error in scheduleNotification:', error);
    return false;
  }
};

/**
 * Send an SMS notification via Twilio
 * @param phone The recipient's phone number
 * @param message The message to send
 * @returns Success status
 */
export const sendSMS = async (phone: string, message: string): Promise<boolean> => {
  try {
    // Check if we're in development mode or missing Twilio credentials
    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
      // Use mock SMS service for development/testing
      console.log('📱 MOCK SMS SENT:', { to: phone, message });
      
      // Show a toast notification instead of sending a real SMS
      if (typeof window !== 'undefined') {
        // Create a mock notification element
        const mockNotification = document.createElement('div');
        mockNotification.style.position = 'fixed';
        mockNotification.style.bottom = '20px';
        mockNotification.style.right = '20px';
        mockNotification.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        mockNotification.style.color = 'white';
        mockNotification.style.padding = '15px';
        mockNotification.style.borderRadius = '8px';
        mockNotification.style.maxWidth = '300px';
        mockNotification.style.zIndex = '9999';
        mockNotification.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
        mockNotification.innerHTML = `
          <div style="margin-bottom: 8px; font-weight: bold;">SMS Notification</div>
          <div style="font-size: 14px; margin-bottom: 5px;">To: ${phone}</div>
          <div style="font-size: 14px;">${message}</div>
        `;
        
        // Add to document
        document.body.appendChild(mockNotification);
        
        // Remove after 5 seconds
        setTimeout(() => {
          mockNotification.style.opacity = '0';
          mockNotification.style.transition = 'opacity 0.5s ease';
          setTimeout(() => document.body.removeChild(mockNotification), 500);
        }, 5000);
      }
      
      return true; // Return success for mock service
    }
    
    // Use the API route for real Twilio integration
    const response = await fetch('/api/send-sms', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phone,
        message,
      }),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to send SMS: ${response.statusText}`);
    }
    
    const result = await response.json();
    return result.success;
  } catch (error) {
    console.error('Error sending SMS:', error);
    return false;
  }
};

/**
 * Process pending notifications that are due to be sent
 * @returns Number of notifications processed
 */
export const processPendingNotifications = async (): Promise<number> => {
  try {
    const now = new Date();
    
    // Get all pending notifications that are due
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('sent', false)
      .lte('scheduled_time', now.toISOString());
    
    if (error) {
      console.error('Error getting pending notifications:', error);
      return 0;
    }
    
    if (!data || data.length === 0) {
      return 0;
    }
    
    let sentCount = 0;
    
    // Process each notification
    for (const notification of data) {
      const success = await sendSMS(notification.phone, notification.message);
      
      if (success) {
        // Update notification as sent
        await supabase
          .from('notifications')
          .update({ sent: true, sent_at: new Date().toISOString() })
          .eq('id', notification.id);
        
        sentCount++;
      }
    }
    
    return sentCount;
  } catch (error) {
    console.error('Error in processPendingNotifications:', error);
    return 0;
  }
};

/**
 * Create an appointment notification with complete details
 * @param appointmentData The appointment data
 * @returns The formatted notification data
 */
export const createAppointmentNotification = (
  appointmentData: {
    doctorId: string;
    doctorName: string;
    date: string;
    time: string;
    patientName: string;
    patientEmail: string;
    patientPhone: string;
    reason?: string;
    fees?: number;
    location?: string;
  }
): NotificationData => {
  // Format the date for display
  const formattedDate = new Date(appointmentData.date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  // Create a comprehensive message with all appointment details
  const message = `
🏥 APPOINTMENT CONFIRMATION 🏥

Doctor: Dr. ${appointmentData.doctorName}
Date: ${formattedDate}
Time: ${appointmentData.time}
${appointmentData.location ? `Location: ${appointmentData.location}` : ''}
${appointmentData.fees ? `Fees: ₹${appointmentData.fees}` : ''}
${appointmentData.reason ? `Reason: ${appointmentData.reason}` : ''}

Please arrive 15 minutes early. To reschedule or cancel, call our office or reply to this message.

- Hygieia Health Assistant
`.trim();
  
  // Calculate notification time (24 hours before appointment)
  const appointmentDateTime = new Date(`${appointmentData.date}T${appointmentData.time}`);
  const notificationTime = new Date(appointmentDateTime);
  notificationTime.setHours(notificationTime.getHours() - 24);
  
  return {
    userId: 'anonymous', // Replace with actual user ID in production
    phone: appointmentData.patientPhone,
    message,
    scheduledTime: notificationTime.toISOString(),
    type: 'appointment',
    metadata: {
      appointmentId: appointmentData.doctorId,
      doctorName: appointmentData.doctorName,
      date: appointmentData.date,
      time: appointmentData.time
    }
  };
};

/**
 * Send an immediate appointment confirmation
 * @param appointmentData The appointment data
 * @returns Success status
 */
export const sendAppointmentConfirmation = async (
  appointmentData: {
    doctorId: string;
    doctorName: string;
    date: string;
    time: string;
    patientName: string;
    patientEmail: string;
    patientPhone: string;
    reason?: string;
    fees?: number;
    location?: string;
  }
): Promise<boolean> => {
  try {
    // Create the notification data
    const notificationData = createAppointmentNotification(appointmentData);
    
    // Send the confirmation immediately
    const success = await sendSMS(appointmentData.patientPhone, notificationData.message);
    
    if (success) {
      // Also schedule a reminder for 24 hours before the appointment
      await scheduleNotification(notificationData);
    }
    
    return success;
  } catch (error) {
    console.error('Error sending appointment confirmation:', error);
    return false;
  }
};
