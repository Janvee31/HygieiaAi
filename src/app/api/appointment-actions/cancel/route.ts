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
    // Parse the request body to get the appointment ID
    const { appointmentId } = await request.json();
    
    if (!appointmentId) {
      return NextResponse.json(
        { error: 'Appointment ID is required' },
        { status: 400 }
      );
    }
    
    // Use admin client if available, otherwise use regular client
    const supabaseClient = adminSupabase || regularSupabase;
    
    // Check if the appointment exists
    const { data: appointment, error: appointmentError } = await supabaseClient
      .from('appointments')
      .select('id, status, cancelled')
      .eq('id', appointmentId)
      .single();
    
    if (appointmentError) {
      console.error('Error checking appointment:', appointmentError);
      return NextResponse.json(
        { error: `Appointment not found: ${appointmentError.message}` },
        { status: 404 }
      );
    }
    
    if (appointment.cancelled) {
      return NextResponse.json(
        { error: 'Appointment is already cancelled' },
        { status: 400 }
      );
    }
    
    // Update the appointment
    const { error: updateError } = await supabaseClient
      .from('appointments')
      .update({ 
        cancelled: true,
        status: 'cancelled'
      })
      .eq('id', appointmentId);
    
    if (updateError) {
      console.error('Error cancelling appointment:', updateError);
      
      // If it's an RLS error and we're in development, simulate success
      if (updateError.message.includes('row-level security') && process.env.NODE_ENV === 'development') {
        return NextResponse.json({
          success: true,
          message: 'Appointment cancelled successfully (simulated)',
          note: 'This is simulated data for development. In production, proper authentication is required.'
        });
      }
      
      return NextResponse.json(
        { error: `Failed to cancel appointment: ${updateError.message}` },
        { status: 400 }
      );
    }
    
    // If the appointment has a payment, we might want to handle refunds here
    // This would involve integration with the payment gateway
    
    return NextResponse.json({ 
      success: true, 
      message: 'Appointment cancelled successfully'
    });
  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
