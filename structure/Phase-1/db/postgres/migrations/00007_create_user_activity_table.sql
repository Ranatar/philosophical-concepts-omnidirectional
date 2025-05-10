-- Migration: Create user_activity table
-- Description: Creates the user_activity table to track user actions in the system

-- Begin transaction
BEGIN;

-- Create activity_type enum
CREATE TYPE activity_type AS ENUM (
  'login',
  'logout',
  'create_concept',
  'update_concept',
  'delete_concept',
  'view_concept',
  'create_graph',
  'update_graph',
  'delete_graph',
  'create_thesis',
  'update_thesis',
  'delete_thesis',
  'create_synthesis',
  'update_synthesis',
  'delete_synthesis',
  'claude_interaction',
  'analyze_name',
  'detect_origin',
  'create_historical_context',
  'create_practical_application',
  'create_dialogue',
  'analyze_evolution'
);

-- Create user_activity table
CREATE TABLE IF NOT EXISTS user_activity (
  activity_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  activity_type activity_type NOT NULL,
  target_id UUID,
  activity_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  details JSONB DEFAULT '{}'
);

-- Create indexes for performance
CREATE INDEX idx_user_activity_user_id ON user_activity(user_id);
CREATE INDEX idx_user_activity_activity_type ON user_activity(activity_type);
CREATE INDEX idx_user_activity_target_id ON user_activity(target_id);
CREATE INDEX idx_user_activity_activity_date ON user_activity(activity_date);

-- Add table comments
COMMENT ON TABLE user_activity IS 'Tracks user activities and actions in the system';
COMMENT ON COLUMN user_activity.activity_id IS 'Unique identifier for the activity';
COMMENT ON COLUMN user_activity.user_id IS 'Reference to the user who performed the activity';
COMMENT ON COLUMN user_activity.activity_type IS 'Type of activity performed';
COMMENT ON COLUMN user_activity.target_id IS 'ID of the target resource (concept, thesis, etc.)';
COMMENT ON COLUMN user_activity.activity_date IS 'Timestamp when the activity occurred';
COMMENT ON COLUMN user_activity.details IS 'Additional details about the activity';

-- Commit transaction
COMMIT;
