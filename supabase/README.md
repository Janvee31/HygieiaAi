# Supabase Setup Guide for Hygieia Health Companion

This guide explains how to properly set up the Supabase database for the Hygieia Health Companion application.

## Database Setup Instructions

To avoid the "relation 'secrets' does not exist" error, follow these steps:

### Step 1: Create Tables

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Copy and paste the contents of `tables_only.sql` into the SQL Editor
4. Run the SQL script
5. This will create all the necessary tables with proper Row Level Security (RLS) policies

### Step 2: Set Up Storage Bucket

The storage bucket setup needs to be done separately to avoid the "relation 'secrets' does not exist" error:

1. First, create the storage bucket manually:
   - Go to Storage in your Supabase dashboard
   - Click "Create a new bucket"
   - Name it "doctor_images"
   - Check "Public bucket" to make it publicly accessible
   - Click "Create bucket"

2. Then set up the storage policies:
   - Go to the SQL Editor
   - Copy and paste the contents of `storage_setup.sql` into the SQL Editor
   - Run the SQL script
   - This will set up the necessary policies for the storage bucket

## File Descriptions

- `tables_only.sql`: Creates all database tables with proper RLS policies
- `storage_setup.sql`: Sets up storage bucket policies (run this after creating the bucket manually)
- `schema.sql`: Full schema (not recommended due to potential errors)
- `simple_schema.sql`: Simplified schema (alternative approach)

## Troubleshooting

If you encounter the "relation 'secrets' does not exist" error:
1. Make sure you're running the scripts in the correct order
2. Create the storage bucket manually through the Supabase dashboard
3. Run the storage policies script separately
4. If problems persist, try using the SQL Editor in the Supabase dashboard instead of the CLI

## Environment Variables

Make sure your `.env` file contains the correct Supabase configuration:

```
NEXT_PUBLIC_SUPABASE_URL="https://your-project-url.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_URL="https://your-project-url.supabase.co"
SUPABASE_ANON_KEY="your-anon-key"
```
