import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Create a Supabase client with the service role key
// This bypasses RLS policies since it has admin privileges
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Only create the admin client if both URL and key are available
const adminSupabase = supabaseUrl && supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

export async function POST(request: Request) {
  try {
    // Check if admin client is available
    if (!adminSupabase) {
      console.error('Supabase admin client not initialized');
      return NextResponse.json({ 
        error: 'Server configuration error' 
      }, { status: 500 });
    }

    // Parse the request body
    const doctorData = await request.json();
    console.log('Received doctor data:', doctorData);

    // Validate required fields
    const requiredFields = ['name', 'email', 'speciality', 'degree', 'experience', 'fees', 'about'];
    for (const field of requiredFields) {
      if (!doctorData[field]) {
        return NextResponse.json({ 
          error: `Missing required field: ${field}` 
        }, { status: 400 });
      }
    }

    // Check if a doctor with this email already exists
    const { data: existingDoctor, error: checkError } = await adminSupabase
      .from('doctors')
      .select('email')
      .eq('email', doctorData.email)
      .maybeSingle();

    if (checkError) {
      console.error('Error checking existing doctor:', checkError);
      return NextResponse.json({ 
        error: `Database error: ${checkError.message}` 
      }, { status: 500 });
    }

    if (existingDoctor) {
      return NextResponse.json({ 
        error: `A doctor with email ${doctorData.email} already exists` 
      }, { status: 409 });
    }

    // Insert the new doctor
    const { data, error } = await adminSupabase
      .from('doctors')
      .insert([doctorData])
      .select();

    if (error) {
      console.error('Error adding doctor:', error);
      return NextResponse.json({ 
        error: `Failed to add doctor: ${error.message}` 
      }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
