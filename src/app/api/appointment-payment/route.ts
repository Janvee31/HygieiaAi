import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Create clients - admin for bypassing RLS and regular for normal operations
const adminSupabase = supabaseUrl && supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;
const regularSupabase = createClient(supabaseUrl, supabaseAnonKey);

export async function POST(request: Request) {
  try {
    const paymentData = await request.json();
    
    // Validate required fields
    const requiredFields = ['appointment_id', 'amount', 'payment_id', 'payment_status'];
    for (const field of requiredFields) {
      if (!paymentData[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }
    
    // Use admin client if available, otherwise use regular client
    const supabaseClient = adminSupabase || regularSupabase;
    
    // Check if the appointment exists
    const { data: appointment, error: appointmentError } = await supabaseClient
      .from('appointments')
      .select('id, user_id, doctor_id, status')
      .eq('id', paymentData.appointment_id)
      .single();
    
    if (appointmentError) {
      console.error('Error checking appointment:', appointmentError);
      return NextResponse.json(
        { error: `Appointment not found: ${appointmentError.message}` },
        { status: 404 }
      );
    }
    
    // Insert the payment
    const { data: payment, error: paymentError } = await supabaseClient
      .from('payments')
      .insert([paymentData])
      .select();
    
    if (paymentError) {
      console.error('Error creating payment:', paymentError);
      
      // If it's an RLS error and we're in development, simulate success
      if (paymentError.message.includes('row-level security') && process.env.NODE_ENV === 'development') {
        return NextResponse.json({
          success: true,
          data: [{
            id: 'simulated-id-' + Date.now(),
            ...paymentData,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }],
          note: 'This is simulated data for development. In production, proper authentication is required.'
        });
      }
      
      return NextResponse.json(
        { error: `Failed to create payment: ${paymentError.message}` },
        { status: 400 }
      );
    }
    
    // Update the appointment status
    const { error: updateError } = await supabaseClient
      .from('appointments')
      .update({ 
        payment: true,
        status: 'confirmed'
      })
      .eq('id', paymentData.appointment_id);
    
    if (updateError) {
      console.error('Error updating appointment:', updateError);
      // We won't fail the request if this update fails, but we'll log it
    }
    
    const notification = await sendAppointmentConfirmation(supabaseClient, {
      appointmentId: paymentData.appointment_id,
      userId: appointment.user_id,
      doctorId: appointment.doctor_id
    });
    
    return NextResponse.json({ 
      success: true, 
      payment: payment[0],
      notification,
      message: 'Payment recorded successfully'
    });
  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function sendAppointmentConfirmation(
  supabaseClient: any,
  ids: { appointmentId: string; userId: string; doctorId: string }
) {
  try {
    const [{ data: appointment }, { data: user }, { data: doctor }] = await Promise.all([
      supabaseClient
        .from('appointments')
        .select('id, appointment_date, appointment_time')
        .eq('id', ids.appointmentId)
        .single(),
      supabaseClient
        .from('users')
        .select('id, name, email, phone')
        .eq('id', ids.userId)
        .single(),
      supabaseClient
        .from('doctors')
        .select('id, name, speciality, fees, address')
        .eq('id', ids.doctorId)
        .single()
    ]);

    const phone = normalizePhone(user?.phone);
    if (!appointment || !user || !doctor || !phone) {
      return { success: false, skipped: true, reason: 'Missing appointment, doctor, user, or phone data' };
    }

    const formattedDate = new Date(appointment.appointment_date).toLocaleDateString('en-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const location = doctor.address?.line1 || doctor.address?.city || 'Hygieia Health Center';
    const message = [
      'Hygieia appointment confirmed.',
      `Patient: ${user.name}`,
      `Doctor: ${doctor.name} (${doctor.speciality})`,
      `Date: ${formattedDate}`,
      `Time: ${appointment.appointment_time}`,
      `Fees: INR ${doctor.fees}`,
      `Location: ${location}`,
      `Confirmation: ${appointment.id.slice(0, 8).toUpperCase()}`,
      'Please arrive 15 minutes early.'
    ].join('\n');

    await storeNotification(supabaseClient, {
      userId: user.id,
      phone,
      message,
      appointmentId: appointment.id,
      doctorName: doctor.name
    });

    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const from = process.env.TWILIO_PHONE_NUMBER;

    if (!accountSid || !authToken || !from) {
      console.log('Twilio credentials missing; confirmation stored but SMS not sent.');
      return { success: false, stored: true, skipped: true, reason: 'Twilio credentials not configured' };
    }

    const twilio = require('twilio');
    const client = twilio(accountSid, authToken);
    const result = await client.messages.create({
      body: message,
      from,
      to: phone
    });

    return { success: true, stored: true, messageId: result.sid };
  } catch (error: any) {
    console.error('Appointment SMS notification failed:', error);
    return { success: false, error: error.message || 'Notification failed' };
  }
}

async function storeNotification(
  supabaseClient: any,
  data: { userId: string; phone: string; message: string; appointmentId: string; doctorName: string }
) {
  try {
    await supabaseClient
      .from('notifications')
      .insert([{
        user_id: data.userId,
        phone: data.phone,
        phone_number: data.phone,
        message: data.message,
        scheduled_time: new Date().toISOString(),
        type: 'appointment',
        status: 'sent',
        sent: true,
        sent_at: new Date().toISOString(),
        metadata: {
          appointmentId: data.appointmentId,
          doctorName: data.doctorName
        }
      }]);
  } catch (error) {
    console.warn('Could not store notification record:', error);
  }
}

function normalizePhone(phone?: string) {
  if (!phone) return '';
  const trimmed = phone.trim().replace(/\s+/g, '');
  if (!trimmed) return '';
  if (trimmed.startsWith('+')) return trimmed;
  return `+${trimmed}`;
}

export async function GET(request: Request) {
  try {
    // Parse query parameters
    const url = new URL(request.url);
    const appointmentId = url.searchParams.get('appointment_id');
    const userId = url.searchParams.get('user_id');
    const status = url.searchParams.get('status');
    
    // Use admin client if available, otherwise use regular client
    const supabaseClient = adminSupabase || regularSupabase;
    
    // Start building the query
    let query = supabaseClient.from('payments').select(`
      *,
      appointments (id, user_id, doctor_id, appointment_date, appointment_time, status)
    `);
    
    // Apply filters if provided
    if (appointmentId) {
      query = query.eq('appointment_id', appointmentId);
    }
    
    if (status) {
      query = query.eq('payment_status', status);
    }
    
    // Execute the query
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching payments:', error);
      return NextResponse.json(
        { error: `Failed to fetch payments: ${error.message}` },
        { status: 400 }
      );
    }
    
    // If userId is provided, filter by user_id in appointments
    let filteredData = data;
    if (userId) {
      filteredData = data.filter(payment => 
        payment.appointments?.user_id === userId
      );
    }
    
    return NextResponse.json({ 
      success: true,
      payments: filteredData,
      count: filteredData.length
    });
  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
