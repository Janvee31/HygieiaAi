-- Create chat_messages table
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  agent_id VARCHAR NOT NULL,
  sender VARCHAR NOT NULL CHECK (sender IN ('user', 'ai')),
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies for chat_messages
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own messages
CREATE POLICY "Users can view their own messages"
  ON chat_messages
  FOR SELECT
  USING (auth.uid() = user_id);

-- Allow users to insert their own messages
CREATE POLICY "Users can insert their own messages"
  ON chat_messages
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  phone_number VARCHAR,
  message TEXT NOT NULL,
  scheduled_time TIMESTAMP WITH TIME ZONE NOT NULL,
  type VARCHAR NOT NULL,
  status VARCHAR NOT NULL DEFAULT 'scheduled',
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies for notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own notifications
CREATE POLICY "Users can view their own notifications"
  ON notifications
  FOR SELECT
  USING (auth.uid() = user_id);

-- Allow users to insert their own notifications
CREATE POLICY "Users can insert their own notifications"
  ON notifications
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create user_preferences table for storing agent preferences
CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  preference_key VARCHAR NOT NULL,
  preference_value JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, preference_key)
);

-- Add RLS policies for user_preferences
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own preferences
CREATE POLICY "Users can view their own preferences"
  ON user_preferences
  FOR SELECT
  USING (auth.uid() = user_id);

-- Allow users to insert their own preferences
CREATE POLICY "Users can insert their own preferences"
  ON user_preferences
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own preferences
CREATE POLICY "Users can update their own preferences"
  ON user_preferences
  FOR UPDATE
  USING (auth.uid() = user_id);
