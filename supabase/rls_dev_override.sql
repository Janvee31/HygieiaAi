-- Development-only RLS policy overrides for Hygieia Health Companion App
-- These policies are more permissive for development purposes

-- Drop existing RLS policies for doctors table
DROP POLICY IF EXISTS "Anyone can view doctors" ON doctors;
DROP POLICY IF EXISTS "Authenticated users can create doctors" ON doctors;

-- Create more permissive policies for development
CREATE POLICY "Anyone can view doctors" 
  ON doctors FOR SELECT 
  USING (true);

CREATE POLICY "Anyone can insert doctors" 
  ON doctors FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Anyone can update doctors" 
  ON doctors FOR UPDATE 
  USING (true);

-- Note: In production, you would want to revert to more restrictive policies
-- such as requiring authentication for insert/update operations
