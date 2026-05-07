import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/utils/supabase';

// Twilio credentials from environment variables
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

export async function POST(request: NextRequest) {
  try {
    const { userId = 'anonymous', phone, message, scheduledTime, type } = await request.json();
    
    // Validate UUID format for userId if it's not 'anonymous'
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const validUserId = userId === 'anonymous' || uuidRegex.test(userId);
    
    if (!validUserId || !message || !scheduledTime || !type) {
      return NextResponse.json({ 
        success: false, 
        message: 'Missing required fields' 
      }, { status: 400 });
    }
    
    // Store notification in database
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        phone_number: phone,
        message: message,
        scheduled_time: scheduledTime,
        type: type,
        status: 'scheduled'
      })
      .select();
    
    if (error) {
      throw error;
    }
    
    // If Twilio is configured, schedule the notification
    if (accountSid && authToken && twilioPhoneNumber && phone) {
      // In a production environment, you would use a job scheduler
      // For this demo, we'll simulate scheduling by storing the data
      console.log(`Notification scheduled for ${scheduledTime}: ${message}`);
      
      // For immediate testing, you can send a test message
      if (process.env.NODE_ENV === 'development') {
        await mockSendNotification(phone, message);
      }
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Notification scheduled successfully',
      notificationId: data?.[0]?.id
    });
    
  } catch (error) {
    console.error('Error scheduling notification:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Failed to schedule notification' 
    }, { status: 500 });
  }
}

// Mock function to simulate sending a notification without requiring Twilio package
async function mockSendNotification(phone: string, message: string) {
  try {
    // Log the notification details instead of actually sending it
    console.log('=== MOCK NOTIFICATION ===');
    console.log(`To: ${phone}`);
    console.log(`Message: ${message}`);
    console.log('=== END MOCK NOTIFICATION ===');
    
    // Simulate a delay to mimic API call
    await new Promise(resolve => setTimeout(resolve, 500));
    
    console.log(`Mock notification sent to ${phone}`);
    return { sid: 'MOCK_SID_' + Date.now(), status: 'sent' };
  } catch (error) {
    console.error('Error sending mock notification:', error);
    throw error;
  }
}
