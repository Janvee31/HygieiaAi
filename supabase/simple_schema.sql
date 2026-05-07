-- Simple Supabase Schema for Hygieia Health Companion App
-- This simplified schema avoids the "relation 'secrets' does not exist" error

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users Table
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR NOT NULL UNIQUE,
  name VARCHAR NOT NULL,
  phone VARCHAR DEFAULT '0000000000',
  gender VARCHAR DEFAULT 'Not Selected',
  dob VARCHAR DEFAULT 'Not Selected',
  image VARCHAR DEFAULT 'https://api.dicebear.com/7.x/avataaars/svg?seed=default',
  address JSONB DEFAULT '{"line1": "", "line2": ""}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Doctors Table
CREATE TABLE IF NOT EXISTS public.doctors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR NOT NULL,
  email VARCHAR NOT NULL UNIQUE,
  image VARCHAR NOT NULL,
  speciality VARCHAR NOT NULL,
  degree VARCHAR NOT NULL,
  experience VARCHAR NOT NULL,
  about TEXT NOT NULL,
  available BOOLEAN DEFAULT TRUE,
  fees INTEGER NOT NULL,
  slots_booked JSONB DEFAULT '{}',
  address JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Appointments Table
CREATE TABLE IF NOT EXISTS public.appointments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id),
  doctor_id UUID NOT NULL REFERENCES doctors(id),
  appointment_date DATE NOT NULL,
  appointment_time VARCHAR NOT NULL,
  status VARCHAR NOT NULL DEFAULT 'pending',
  payment BOOLEAN DEFAULT FALSE,
  cancelled BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payments Table
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  appointment_id UUID NOT NULL REFERENCES appointments(id),
  amount INTEGER NOT NULL,
  payment_id VARCHAR NOT NULL,
  payment_status VARCHAR NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create a storage bucket for doctor images
-- Note: Run this separately in the SQL editor if you get an error
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('doctor_images', 'doctor_images', true);

-- Note: You'll need to create the storage bucket and policies manually
-- in the Supabase dashboard if the above command fails
