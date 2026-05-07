-- Tables-only Supabase Schema for Hygieia Health Companion App
-- This schema focuses only on creating tables and avoids storage operations
-- that might cause the "relation 'secrets' does not exist" error

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users Table
CREATE TABLE IF NOT EXISTS users (
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
CREATE TABLE IF NOT EXISTS doctors (
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
  USING (true);

CREATE POLICY "Authenticated users can create doctors" 
  ON doctors FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated');

-- Appointments Table
CREATE TABLE IF NOT EXISTS appointments (
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

-- Prevent double booking active appointment slots for the same doctor
CREATE UNIQUE INDEX IF NOT EXISTS appointments_unique_active_slot
  ON appointments (doctor_id, appointment_date, appointment_time)
  WHERE cancelled = FALSE AND status <> 'cancelled';

-- Payments Table
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  appointment_id UUID NOT NULL REFERENCES appointments(id),
  amount INTEGER NOT NULL,
  payment_id VARCHAR NOT NULL,
  payment_status VARCHAR NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security for Payments
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Payments
CREATE POLICY "Users can view their own payments" 
  ON payments FOR SELECT 
  USING (
    auth.uid() IN (
      SELECT user_id FROM appointments WHERE id = appointment_id
    )
  );

CREATE POLICY "Users can create their own payments" 
  ON payments FOR INSERT 
  WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM appointments WHERE id = appointment_id
    )
  );

-- Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  phone VARCHAR,
  phone_number VARCHAR,
  message TEXT NOT NULL,
  scheduled_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  type VARCHAR NOT NULL DEFAULT 'general',
  status VARCHAR NOT NULL DEFAULT 'scheduled',
  metadata JSONB DEFAULT '{}',
  sent BOOLEAN DEFAULT FALSE,
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security for Notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Notifications
CREATE POLICY "Users can view their own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can create their own notifications"
  ON notifications FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);
