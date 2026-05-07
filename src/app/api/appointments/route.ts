import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Create a fallback client if service key is not available
const adminSupabase = supabaseUrl && supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

// Create a regular client using the public anon key as fallback
const regularSupabase = createClient(supabaseUrl, supabaseAnonKey);

export async function POST(request: Request) {
  try {
    const doctorData = await request.json();
    
    // Validate required fields
    const requiredFields = ['name', 'email', 'speciality', 'degree', 'experience', 'fees', 'about', 'image', 'address'];
    for (const field of requiredFields) {
      if (!doctorData[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }
    
    // Check if a doctor with this email already exists
    let supabaseClient = adminSupabase || regularSupabase;
    
    const { data: existingDoctor, error: checkError } = await supabaseClient
      .from('doctors')
      .select('email')
      .eq('email', doctorData.email)
      .maybeSingle();
    
    if (checkError) {
      console.error('Error checking existing doctor:', checkError);
      return NextResponse.json(
        { error: `Database error: ${checkError.message}` },
        { status: 500 }
      );
    }
    
    if (existingDoctor) {
      return NextResponse.json(
        { error: `A doctor with email ${doctorData.email} already exists` },
        { status: 409 }
      );
    }
    
    // Insert doctor data using admin privileges if available, otherwise use regular client
    const { data, error } = await supabaseClient
      .from('doctors')
      .insert([doctorData])
      .select();
    
    if (error) {
      console.error('Supabase error:', error);
      
      // If it's an RLS error and we're in development, simulate success
      if (error.message.includes('row-level security') && process.env.NODE_ENV === 'development') {
        // Create a mock response for development
        return NextResponse.json({
          success: true,
          data: [{
            id: 'simulated-id-' + Date.now(),
            ...doctorData,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }],
          note: 'This is simulated data for development. In production, proper authentication is required.'
        });
      }
      
      return NextResponse.json(
        { error: `Failed to add doctor: ${error.message}` },
        { status: 400 }
      );
    }
    
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    // Parse query parameters
    const url = new URL(request.url);
    const userId = url.searchParams.get('user_id');
    const appointmentId = url.searchParams.get('id');
    
    // Use admin client if available, otherwise use regular client
    let supabaseClient = adminSupabase || regularSupabase;
    
    console.log('API route: Fetching appointments...');
    
    // Start building the query for appointments
    let query = supabaseClient.from('appointments').select('*');
    
    // Apply filters if provided
    if (userId) {
      query = query.eq('user_id', userId);
    }
    
    if (appointmentId) {
      query = query.eq('id', appointmentId);
    }
    
    // Execute the query
    const { data: appointmentsData, error: appointmentsError } = await query;
    
    if (appointmentsError) {
      console.error('Error fetching appointments:', appointmentsError);
      return NextResponse.json(
        { error: `Failed to fetch appointments: ${appointmentsError.message}` },
        { status: 400 }
      );
    }
    
    console.log(`API route: Found ${appointmentsData?.length || 0} appointments`);
    
    // If no appointments found, return empty array
    if (!appointmentsData || appointmentsData.length === 0) {
      return NextResponse.json({ 
        success: true,
        appointments: [],
        count: 0
      });
    }
    
    // Get all unique doctor IDs from appointments
    const doctorIds = [...new Set(appointmentsData.map(appointment => appointment.doctor_id))];
    
    // Fetch doctor details for all appointments
    const { data: doctorsData, error: doctorsError } = await supabaseClient
      .from('doctors')
      .select('*')
      .in('id', doctorIds);
    
    if (doctorsError) {
      console.error('Error fetching doctors:', doctorsError);
      // Continue with appointments data even if doctor details fetch fails
    }
    
    // Create a map of doctor details by ID for quick lookup
    const doctorsMap = (doctorsData || []).reduce((map, doctor) => {
      map[doctor.id] = doctor;
      return map;
    }, {});
    
    // Combine appointment data with doctor details
    const enrichedAppointments = appointmentsData.map(appointment => {
      const doctor = doctorsMap[appointment.doctor_id] || {};
      return {
        ...appointment,
        doctor_name: doctor.name || 'Doctor',
        doctor_speciality: doctor.speciality || 'Specialist',
        doctor_image: doctor.image || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default',
        doctor_fees: doctor.fees || 1500
      };
    });
    
    return NextResponse.json({ 
      success: true,
      appointments: enrichedAppointments,
      count: enrichedAppointments.length
    });
  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
