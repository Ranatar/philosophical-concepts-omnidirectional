-- Migration: Create concept_names table
-- Description: Creates the concept_names table to store name analyses and alternatives

-- Begin transaction
BEGIN;

-- Create concept_names table
CREATE TABLE IF NOT EXISTS concept_names (
  name_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  concept_id UUID NOT NULL REFERENCES concepts(concept_id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  analysis TEXT,
  alternative_names JSONB DEFAULT '[]',
  analyzed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  interaction_id UUID REFERENCES claude_interactions(interaction_id) ON DELETE SET NULL
);

-- Create indexes for performance
CREATE INDEX idx_concept_names_concept_id ON concept_names(concept_id);
CREATE INDEX idx_concept_names_name ON concept_names(name);
CREATE INDEX idx_concept_names_interaction_id ON concept_names(interaction_id);
CREATE INDEX idx_concept_names_analyzed_at ON concept_names(analyzed_at);
CREATE INDEX idx_concept_names_alternative_names ON concept_names USING GIN (alternative_names);

-- Add table comments
COMMENT ON TABLE concept_names IS 'Stores analyses of concept names and alternative names';
COMMENT ON COLUMN concept_names.name_id IS 'Unique identifier for the name analysis';
COMMENT ON COLUMN concept_names.concept_id IS 'Reference to the concept';
COMMENT ON COLUMN concept_names.name IS 'Name of the concept';
COMMENT ON COLUMN concept_names.analysis IS 'Textual analysis of the name';
COMMENT ON COLUMN concept_names.alternative_names IS 'Array of alternative name suggestions';
COMMENT ON COLUMN concept_names.analyzed_at IS 'Timestamp when the name was analyzed';
COMMENT ON COLUMN concept_names.interaction_id IS 'Reference to the Claude interaction that produced the analysis';

-- Commit transaction
COMMIT;
