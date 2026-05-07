-- Storage bucket configuration for Hygieia Health Companion App
-- Run this separately in the Supabase SQL Editor after running tables_only.sql

-- Create a storage bucket for doctor images
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
