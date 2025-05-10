-- Migration: Create dialogue_interpretations table
-- Description: Creates the dialogue_interpretations table to store dialogues between philosophical concepts

-- Begin transaction
BEGIN;

-- Create dialogue_interpretations table
CREATE TABLE IF NOT EXISTS dialogue_interpretations (
  dialogue_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  philosophical_question TEXT NOT NULL,
  dialogue_content TEXT NOT NULL,
  discussion_points JSONB DEFAULT '[]',
  arguments JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  interaction_id UUID REFERENCES claude_interactions(interaction_id) ON DELETE SET NULL
);

-- Create indexes for performance
CREATE INDEX idx_dialogue_interpretations_created_at ON dialogue_interpretations(created_at);
CREATE INDEX idx_dialogue_interpretations_interaction_id ON dialogue_interpretations(interaction_id);
CREATE INDEX idx_dialogue_interpretations_discussion_points ON dialogue_interpretations USING GIN (discussion_points);
CREATE INDEX idx_dialogue_interpretations_arguments ON dialogue_interpretations USING GIN (arguments);

-- Add table comments
COMMENT ON TABLE dialogue_interpretations IS 'Stores dialogues and discussions between philosophical concepts';
COMMENT ON COLUMN dialogue_interpretations.dialogue_id IS 'Unique identifier for the dialogue';
COMMENT ON COLUMN dialogue_interpretations.philosophical_question IS 'The question that forms the basis for the dialogue';
COMMENT ON COLUMN dialogue_interpretations.dialogue_content IS 'The full content of the dialogue';
COMMENT ON COLUMN dialogue_interpretations.discussion_points IS 'Structured array of key discussion points';
COMMENT ON COLUMN dialogue_interpretations.arguments IS 'Structured array of arguments presented in the dialogue';
COMMENT ON COLUMN dialogue_interpretations.created_at IS 'Timestamp when the dialogue was created';
COMMENT ON COLUMN dialogue_interpretations.interaction_id IS 'Reference to the Claude interaction that produced the dialogue';

-- Commit transaction
COMMIT;
