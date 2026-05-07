-- Supabase Schema for Hygieia Health Companion App

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS public;

-- Set up storage for doctor images
INSERT INTO storage.buckets (id, name, public)
VALUES ('doctor_images', 'doctor_images', true)
ON CONFLICT (id) DO NOTHING;

-- Set up security policies for the doctor_images bucket
-- Allow public read access
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public Access" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'doctor_images');

-- Allow authenticated users to upload images
DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;
CREATE POLICY "Authenticated users can upload" ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'doctor_images');

-- Allow authenticated users to update their own images
DROP POLICY IF EXISTS "Authenticated users can update" ON storage.objects;
CREATE POLICY "Authenticated users can update" ON storage.objects
  FOR UPDATE
  USING (bucket_id = 'doctor_images')
  WITH CHECK (bucket_id = 'doctor_images');

-- Allow authenticated users to delete their own images
DROP POLICY IF EXISTS "Authenticated users can delete" ON storage.objects;
CREATE POLICY "Authenticated users can delete" ON storage.objects
  FOR DELETE
  USING (bucket_id = 'doctor_images');

-- Users Table
CREATE TABLE users (
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

-- Enable Row Level Security for Users
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Users
CREATE POLICY "Users can view their own data" 
  ON users FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own data" 
  ON users FOR UPDATE 
  USING (auth.uid() = id);

-- Doctors Table
CREATE TABLE doctors (
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

-- Enable Row Level Security for Doctors
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Doctors
CREATE POLICY "Anyone can view doctors" 
  ON doctors FOR SELECT 
  USING (TRUE);

CREATE POLICY "Only admins can modify doctors" 
  ON doctors FOR ALL 
  USING (auth.uid() IN (SELECT id FROM users WHERE email = (SELECT value FROM secrets WHERE key = 'ADMIN_EMAIL')));

-- Appointments Table
CREATE TABLE appointments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) NOT NULL,
  doctor_id UUID REFERENCES doctors(id) NOT NULL,
  slot_date VARCHAR NOT NULL,
  slot_time VARCHAR NOT NULL,
  user_data JSONB NOT NULL,
  doctor_data JSONB NOT NULL,
  amount INTEGER NOT NULL,
  cancelled BOOLEAN DEFAULT FALSE,
  payment BOOLEAN DEFAULT FALSE,
  is_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security for Appointments
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Appointments
CREATE POLICY "Users can view their own appointments" 
  ON appointments FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own appointments" 
  ON appointments FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own appointments" 
  ON appointments FOR UPDATE 
  USING (auth.uid() = user_id);

-- Payments Table
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  appointment_id UUID REFERENCES appointments(id) NOT NULL,
  user_id UUID REFERENCES users(id) NOT NULL,
  amount INTEGER NOT NULL,
  payment_id VARCHAR,
  order_id VARCHAR,
  receipt VARCHAR,
  payment_status VARCHAR DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security for Payments
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Payments
CREATE POLICY "Users can view their own payments" 
  ON payments FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own payments" 
  ON payments FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Secrets Table for Admin Credentials
CREATE TABLE secrets (
  key VARCHAR PRIMARY KEY,
  value VARCHAR NOT NULL
);

-- Insert Admin Credentials
INSERT INTO secrets (key, value) VALUES ('ADMIN_EMAIL', 'admin@example.com');
INSERT INTO secrets (key, value) VALUES ('ADMIN_PASSWORD', 'greatstack123');

-- Functions

-- Function to update doctor slots when booking an appointment
CREATE OR REPLACE FUNCTION update_doctor_slots()
RETURNS TRIGGER AS $$
BEGIN
  -- Add the slot time to the doctor's booked slots
  UPDATE doctors
  SET slots_booked = jsonb_set(
    slots_booked,
    ARRAY[NEW.slot_date],
    COALESCE(
      slots_booked->(NEW.slot_date),
      '[]'::jsonb
    ) || to_jsonb(NEW.slot_time)
  )
  WHERE id = NEW.doctor_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update doctor slots when booking an appointment
CREATE TRIGGER trigger_update_doctor_slots
AFTER INSERT ON appointments
FOR EACH ROW
EXECUTE FUNCTION update_doctor_slots();

-- Function to remove doctor slots when cancelling an appointment
CREATE OR REPLACE FUNCTION remove_doctor_slots()
RETURNS TRIGGER AS $$
BEGIN
  -- Remove the slot time from the doctor's booked slots
  UPDATE doctors
  SET slots_booked = jsonb_set(
    slots_booked,
    ARRAY[OLD.slot_date],
    (slots_booked->(OLD.slot_date)) - to_jsonb(OLD.slot_time)
  )
  WHERE id = OLD.doctor_id;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Trigger to remove doctor slots when cancelling an appointment
CREATE TRIGGER trigger_remove_doctor_slots
AFTER DELETE ON appointments
FOR EACH ROW
WHEN (OLD.cancelled = FALSE)
EXECUTE FUNCTION remove_doctor_slots();

-- Function to update appointment payment status
CREATE OR REPLACE FUNCTION update_appointment_payment()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the appointment payment status
  UPDATE appointments
  SET payment = TRUE
  WHERE id = NEW.appointment_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update appointment payment status
CREATE TRIGGER trigger_update_appointment_payment
AFTER UPDATE ON payments
FOR EACH ROW
WHEN (NEW.payment_status = 'completed')
EXECUTE FUNCTION update_appointment_payment();
