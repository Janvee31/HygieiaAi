import { NextResponse } from 'next/server';

// Twilio configuration
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER;

/**
 * API route for sending SMS messages via Twilio
 * This keeps Twilio dependencies server-side only
 */
export async function POST(request: Request) {
  try {
    // Check if Twilio is configured
    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
      return NextResponse.json(
        { success: false, error: 'Twilio credentials not configured' },
        { status: 500 }
      );
    }

    // Parse request body
    const { phone, message } = await request.json();
    const normalizedPhone = normalizePhone(phone);
    
    // Validate request
    if (!normalizedPhone || !message) {
      return NextResponse.json(
        { success: false, error: 'Phone number and message are required' },
        { status: 400 }
      );
    }
    
    // Import Twilio only on the server side
    const twilio = require('twilio');
    const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
    
    // Send the SMS
    const result = await client.messages.create({
      body: message,
      from: TWILIO_PHONE_NUMBER,
      to: normalizedPhone
    });
    
    // Return success response
    return NextResponse.json({
      success: true,
      messageId: result.sid
    });
  } catch (error: any) {
    console.error('Error sending SMS:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to send SMS' 
      },
      { status: 500 }
    );
  }
}

function normalizePhone(phone?: string) {
  if (!phone) return '';
  const trimmed = phone.trim().replace(/\s+/g, '');
  if (!trimmed) return '';
  return trimmed.startsWith('+') ? trimmed : `+${trimmed}`;
}
