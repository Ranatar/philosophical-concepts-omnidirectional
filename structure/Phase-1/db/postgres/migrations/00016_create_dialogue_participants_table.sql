-- Migration: Create dialogue_participants table
-- Description: Creates the dialogue_participants table to track concepts participating in dialogues

-- Begin transaction
BEGIN;

-- Create dialogue_participants table
CREATE TABLE IF NOT EXISTS dialogue_participants (
  participant_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dialogue_id UUID NOT NULL REFERENCES dialogue_interpretations(dialogue_id) ON DELETE CASCADE,
  concept_id UUID NOT NULL REFERENCES concepts(concept_id) ON DELETE CASCADE,
  role VARCHAR(100),
  key_theses JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  -- Ensure the combination of dialogue_id and concept_id is unique
  UNIQUE(dialogue_id, concept_id)
);

-- Create indexes for performance
CREATE INDEX idx_dialogue_participants_dialogue_id ON dialogue_participants(dialogue_id);
CREATE INDEX idx_dialogue_participants_concept_id ON dialogue_participants(concept_id);
CREATE INDEX idx_dialogue_participants_role ON dialogue_participants(role);
CREATE INDEX idx_dialogue_participants_created_at ON dialogue_participants(created_at);
CREATE INDEX idx_dialogue_participants_key_theses ON dialogue_participants USING GIN (key_theses);

-- Add table comments
COMMENT ON TABLE dialogue_participants IS 'Tracks concepts participating in philosophical dialogues';
COMMENT ON COLUMN dialogue_participants.participant_id IS 'Unique identifier for the participant';
COMMENT ON COLUMN dialogue_participants.dialogue_id IS 'Reference to the dialogue';
COMMENT ON COLUMN dialogue_participants.concept_id IS 'Reference to the concept participating in the dialogue';
COMMENT ON COLUMN dialogue_participants.role IS 'Role of the concept in the dialogue';
COMMENT ON COLUMN dialogue_participants.key_theses IS 'Key theses or points made by this concept in the dialogue';
COMMENT ON COLUMN dialogue_participants.created_at IS 'Timestamp when the participant was added to the dialogue';

-- Commit transaction
COMMIT;
