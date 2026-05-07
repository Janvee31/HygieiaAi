import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/utils/supabase';
import crypto from 'crypto';

// Initialize Razorpay
const Razorpay = require('razorpay');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

export async function POST(request: NextRequest) {
  try {
    const { appointmentId } = await request.json();
    
    // Get appointment details with doctor information from Supabase
    const { data: appointment, error } = await supabase
      .from('appointments')
      .select(`
        *,
        doctors:doctor_id (*)
      `)
      .eq('id', appointmentId)
      .single();
    
    if (error || !appointment) {
      return NextResponse.json({ 
        success: false, 
        message: 'Appointment not found' 
      }, { status: 404 });
    }
    
    // Create Razorpay order
    const doctorFees = appointment.doctors?.fees || 0;
    
    if (doctorFees === 0) {
      return NextResponse.json({ 
        success: false, 
        message: 'Invalid appointment fee amount' 
      }, { status: 400 });
    }
    
    const options = {
      amount: doctorFees * 100, // Razorpay expects amount in paise
      currency: process.env.CURRENCY || 'INR',
      receipt: `receipt_${appointmentId}`,
      payment_capture: 1,
    };
    
    const order = await razorpay.orders.create(options);
    
    // Save payment details to Supabase
    await supabase
      .from('payments')
      .insert({
        appointment_id: appointmentId,
        user_id: appointment.user_id,
        amount: doctorFees,
        order_id: order.id,
        receipt: options.receipt,
      });
    
    return NextResponse.json({ 
      success: true, 
      order,
    });
  } catch (error) {
    console.error('Razorpay payment error:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Failed to create payment', 
      error: (error as Error).message 
    }, { status: 500 });
  }
}

// Verify Razorpay payment
export async function PUT(request: NextRequest) {
  try {
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = await request.json();
    
    // Verify signature
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET as string)
      .update(body)
      .digest('hex');
    
    const isAuthentic = expectedSignature === razorpay_signature;
    
    if (!isAuthentic) {
      return NextResponse.json({ 
        success: false, 
        message: 'Payment verification failed' 
      }, { status: 400 });
    }
    
    // Update payment status in Supabase
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .select('*')
      .eq('order_id', razorpay_order_id)
      .single();
    
    if (paymentError || !payment) {
      return NextResponse.json({ 
        success: false, 
        message: 'Payment not found' 
      }, { status: 404 });
    }
    
    // Update payment status
    await supabase
      .from('payments')
      .update({
        payment_id: razorpay_payment_id,
        payment_status: 'completed',
      })
      .eq('id', payment.id);
    
    // Update appointment payment status
    await supabase
      .from('appointments')
      .update({
        payment: true,
      })
      .eq('id', payment.appointment_id);
    
    // Send confirmation SMS via Twilio
    await sendPaymentConfirmationSMS(payment.appointment_id);
    
    return NextResponse.json({ 
      success: true, 
      message: 'Payment verified successfully' 
    });
  } catch (error) {
    console.error('Razorpay verification error:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Payment verification failed', 
      error: (error as Error).message 
    }, { status: 500 });
  }
}

// Helper function to send SMS via Twilio
async function sendPaymentConfirmationSMS(appointmentId: string) {
  try {
    // Get appointment and user details
    const { data: appointment, error } = await supabase
      .from('appointments')
      .select(`
        *,
        user_data,
        doctor_data
      `)
      .eq('id', appointmentId)
      .single();
    
    if (error || !appointment) {
      console.error('Failed to get appointment details for SMS:', error);
      return;
    }
    
    // Format appointment date and time
    const appointmentDate = appointment.slot_date.replace(/_/g, '/');
    const doctorName = appointment.doctor_data.name;
    const userPhone = appointment.user_data.phone;
    
    if (!userPhone) {
      console.error('User phone number not found');
      return;
    }
    
    // Initialize Twilio client
    const twilio = require('twilio')(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
    
    // Send SMS
    const message = await twilio.messages.create({
      body: `Your appointment with ${doctorName} on ${appointmentDate} at ${appointment.slot_time} has been confirmed. Payment of ${process.env.CURRENCY}${appointment.amount} received. Thank you for using Hygieia Health Companion!`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: userPhone.startsWith('+') ? userPhone : `+${userPhone}`
    });
    
    console.log('SMS sent successfully:', message.sid);
  } catch (error) {
    console.error('Failed to send SMS:', error);
  }
}
