// Script to apply RLS policy overrides for development
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Read environment variables from .env file
require('dotenv').config();

// Initialize Supabase client with service role key for admin access
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: Supabase URL or service role key is missing.');
  console.error('Make sure you have a .env file with NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
  process.exit(1);
}

// Create Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Read the SQL file
const sqlFilePath = path.join(__dirname, 'supabase', 'rls_dev_override.sql');
const sql = fs.readFileSync(sqlFilePath, 'utf8');

async function applyRlsOverrides() {
  try {
    console.log('Applying RLS policy overrides...');
    
    // Execute the SQL queries
    const { error } = await supabase.rpc('exec_sql', { sql });
    
    if (error) {
      console.error('Error applying RLS policy overrides:', error);
      return;
    }
    
    console.log('RLS policy overrides applied successfully!');
    console.log('You can now add doctors without authentication.');
  } catch (error) {
    console.error('Error:', error);
  }
}

applyRlsOverrides();
