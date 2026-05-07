import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/utils/supabase';

export async function POST(request: NextRequest) {
  try {
    const { userId, doctorId, slotDate, slotTime, userData, doctorData } = await request.json();
    
    // Validate required fields
    if (!userId || !doctorId || !slotDate || !slotTime || !userData || !doctorData) {
      return NextResponse.json({ 
        success: false, 
        message: 'Missing required fields' 
      }, { status: 400 });
    }
    
    // Check if the slot is already booked
    const { data: doctor, error: doctorError } = await supabase
      .from('doctors')
      .select('slots_booked, fees')
      .eq('id', doctorId)
      .single();
    
    if (doctorError || !doctor) {
      return NextResponse.json({ 
        success: false, 
        message: 'Doctor not found' 
      }, { status: 404 });
    }
    
    const slotsBooked = doctor.slots_booked || {};
    const dateSlots = slotsBooked[slotDate] || [];
    
    if (dateSlots.includes(slotTime)) {
      return NextResponse.json({ 
        success: false, 
        message: 'This slot is already booked' 
      }, { status: 400 });
    }
    
    // Create appointment
    const { data: appointment, error: appointmentError } = await supabase
      .from('appointments')
      .insert({
        user_id: userId,
        doctor_id: doctorId,
        slot_date: slotDate,
        slot_time: slotTime,
        user_data: userData,
        doctor_data: doctorData,
        amount: doctor.fees,
      })
      .select()
      .single();
    
    if (appointmentError) {
      return NextResponse.json({ 
        success: false, 
        message: 'Failed to book appointment', 
        error: appointmentError.message 
      }, { status: 500 });
    }
    
    // Update doctor's booked slots
    const updatedSlots = { ...slotsBooked };
    if (!updatedSlots[slotDate]) {
      updatedSlots[slotDate] = [];
    }
    updatedSlots[slotDate].push(slotTime);
    
    await supabase
      .from('doctors')
      .update({
        slots_booked: updatedSlots
      })
      .eq('id', doctorId);
    
    // Send confirmation SMS
    await sendAppointmentConfirmationSMS(appointment);
    
    return NextResponse.json({ 
      success: true, 
      message: 'Appointment booked successfully', 
      appointment 
    });
  } catch (error) {
    console.error('Appointment booking error:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Failed to book appointment', 
      error: (error as Error).message 
    }, { status: 500 });
  }
}

// Helper function to send SMS via Twilio
async function sendAppointmentConfirmationSMS(appointment: any) {
  try {
    const userPhone = appointment.user_data.phone;
    
    if (!userPhone) {
      console.error('User phone number not found');
      return;
    }
    
    // Format appointment date and time
    const appointmentDate = appointment.slot_date.replace(/_/g, '/');
    const doctorName = appointment.doctor_data.name;
    
    // Initialize Twilio client
    const twilio = require('twilio')(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
    
    // Send SMS
    const message = await twilio.messages.create({
      body: `Your appointment with ${doctorName} on ${appointmentDate} at ${appointment.slot_time} has been booked. Please complete the payment to confirm. Thank you for using Hygieia Health Companion!`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: userPhone.startsWith('+') ? userPhone : `+${userPhone}`
    });
    
    console.log('SMS sent successfully:', message.sid);
  } catch (error) {
    console.error('Failed to send SMS:', error);
  }
}
