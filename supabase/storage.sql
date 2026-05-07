-- Create a storage bucket for doctor images
INSERT INTO storage.buckets (id, name, public)
VALUES ('doctor_images', 'doctor_images', true);

-- Set up security policies for the doctor_images bucket
-- Allow public read access
CREATE POLICY "Public Access" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'doctor_images');

-- Allow authenticated users to upload images
CREATE POLICY "Authenticated users can upload" ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'doctor_images' AND auth.role() = 'authenticated');

-- Allow authenticated users to update their own images
CREATE POLICY "Authenticated users can update" ON storage.objects
  FOR UPDATE
  USING (bucket_id = 'doctor_images' AND auth.role() = 'authenticated')
  WITH CHECK (bucket_id = 'doctor_images' AND auth.role() = 'authenticated');

-- Allow authenticated users to delete their own images
CREATE POLICY "Authenticated users can delete" ON storage.objects
  FOR DELETE
  USING (bucket_id = 'doctor_images' AND auth.role() = 'authenticated');
