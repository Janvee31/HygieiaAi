import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with service role key for admin access
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const adminSupabase = createClient(supabaseUrl, supabaseServiceKey);

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: doctorId } = await params;
    const updateData = await request.json();
    
    console.log(`Updating doctor ${doctorId} with:`, updateData);
    
    // Update doctor data using admin privileges
    const { data, error } = await adminSupabase
      .from('doctors')
      .update(updateData)
      .eq('id', doctorId)
      .select();
    
    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: `Failed to update doctor: ${error.message}` },
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

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: doctorId } = await params;
    
    // Fetch doctor by ID using admin privileges
    const { data, error } = await adminSupabase
      .from('doctors')
      .select('*')
      .eq('id', doctorId)
      .single();
    
    if (error) {
      const fallbackDoctor = getFallbackDoctor(doctorId);
      if (fallbackDoctor) {
        return NextResponse.json({ doctor: fallbackDoctor, mockData: true });
      }

      return NextResponse.json(
        { error: `Failed to fetch doctor: ${error.message}` },
        { status: 400 }
      );
    }
    
    return NextResponse.json({ doctor: data });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function getFallbackDoctor(id: string) {
  const doctors = [
    {
      id: '11111111-1111-4111-8111-111111111111',
      legacyId: '1',
      name: 'Dr. Sarah Johnson',
      email: 'sarah.johnson@example.com',
      speciality: 'Cardiology',
      degree: 'MD, FACC',
      experience: '10+ years',
      fees: 1500,
      about: 'Board-certified cardiologist specializing in preventive cardiology and heart failure management.',
      available: true,
      image: 'https://randomuser.me/api/portraits/women/44.jpg',
      slots_booked: {},
      address: { line1: 'Hygieia Heart Center', city: 'Kolkata', state: 'WB', zip: '700091' }
    },
    {
      id: '22222222-2222-4222-8222-222222222222',
      legacyId: '2',
      name: 'Dr. Michael Chen',
      email: 'michael.chen@example.com',
      speciality: 'Neurology',
      degree: 'MD, PhD',
      experience: '15+ years',
      fees: 1800,
      about: 'Neurologist specializing in movement disorders and neurodegenerative diseases.',
      available: true,
      image: 'https://randomuser.me/api/portraits/men/32.jpg',
      slots_booked: {},
      address: { line1: 'Hygieia Neuro Clinic', city: 'Kolkata', state: 'WB', zip: '700091' }
    },
    {
      id: '44444444-4444-4444-8444-444444444444',
      legacyId: '4',
      name: 'Dr. Rajiv Sharma',
      email: 'rajiv.sharma@example.com',
      speciality: 'Orthopedics',
      degree: 'MBBS, MS',
      experience: '12+ years',
      fees: 1600,
      about: 'Orthopedic surgeon specializing in joint replacements and sports injuries.',
      available: true,
      image: 'https://randomuser.me/api/portraits/men/45.jpg',
      slots_booked: {},
      address: { line1: 'Hygieia Bone & Joint Center', city: 'Kolkata', state: 'WB', zip: '700091' }
    }
  ];

  return doctors.find((doctor) => doctor.id === id || doctor.legacyId === id);
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: doctorId } = await params;
    
    // Delete doctor by ID using admin privileges
    const { error } = await adminSupabase
      .from('doctors')
      .delete()
      .eq('id', doctorId);
    
    if (error) {
      return NextResponse.json(
        { error: `Failed to delete doctor: ${error.message}` },
        { status: 400 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
