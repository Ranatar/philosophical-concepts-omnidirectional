-- Migration: Create concept_evolutions table
-- Description: Creates the concept_evolutions table to track concept evolution over time

-- Begin transaction
BEGIN;

-- Create concept_evolutions table
CREATE TABLE IF NOT EXISTS concept_evolutions (
  evolution_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  concept_id UUID NOT NULL REFERENCES concepts(concept_id) ON DELETE CASCADE,
  target_concept_id UUID REFERENCES concepts(concept_id) ON DELETE SET NULL,
  evolution_context TEXT,
  suggested_changes JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  interaction_id UUID REFERENCES claude_interactions(interaction_id) ON DELETE SET NULL
);

-- Create indexes for performance
CREATE INDEX idx_concept_evolutions_concept_id ON concept_evolutions(concept_id);
CREATE INDEX idx_concept_evolutions_target_concept_id ON concept_evolutions(target_concept_id);
CREATE INDEX idx_concept_evolutions_created_at ON concept_evolutions(created_at);
CREATE INDEX idx_concept_evolutions_interaction_id ON concept_evolutions(interaction_id);
CREATE INDEX idx_concept_evolutions_suggested_changes ON concept_evolutions USING GIN (suggested_changes);

-- Add table comments
COMMENT ON TABLE concept_evolutions IS 'Tracks evolution of concepts over time';
COMMENT ON COLUMN concept_evolutions.evolution_id IS 'Unique identifier for the evolution';
COMMENT ON COLUMN concept_evolutions.concept_id IS 'Reference to the original concept';
COMMENT ON COLUMN concept_evolutions.target_concept_id IS 'Reference to the evolved concept (if created)';
COMMENT ON COLUMN concept_evolutions.evolution_context IS 'Contextual explanation of the evolution';
COMMENT ON COLUMN concept_evolutions.suggested_changes IS 'Array of suggested changes for evolution';
COMMENT ON COLUMN concept_evolutions.created_at IS 'Timestamp when the evolution was created';
COMMENT ON COLUMN concept_evolutions.interaction_id IS 'Reference to the Claude interaction that produced the evolution';

-- Commit transaction
COMMIT;
