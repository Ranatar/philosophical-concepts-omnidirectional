-- Migration: Create concept_origins table
-- Description: Creates the concept_origins table to store origins of concepts

-- Begin transaction
BEGIN;

-- Create concept_origins table
CREATE TABLE IF NOT EXISTS concept_origins (
  origin_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  concept_id UUID NOT NULL REFERENCES concepts(concept_id) ON DELETE CASCADE,
  parent_concepts JSONB DEFAULT '[]',
  influence_weights JSONB DEFAULT '[]',
  analysis TEXT,
  detected_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  interaction_id UUID REFERENCES claude_interactions(interaction_id) ON DELETE SET NULL
);

-- Create indexes for performance
CREATE INDEX idx_concept_origins_concept_id ON concept_origins(concept_id);
CREATE INDEX idx_concept_origins_detected_at ON concept_origins(detected_at);
CREATE INDEX idx_concept_origins_interaction_id ON concept_origins(interaction_id);
CREATE INDEX idx_concept_origins_parent_concepts ON concept_origins USING GIN (parent_concepts);
CREATE INDEX idx_concept_origins_influence_weights ON concept_origins USING GIN (influence_weights);

-- Add table comments
COMMENT ON TABLE concept_origins IS 'Stores detected origins and influences for concepts';
COMMENT ON COLUMN concept_origins.origin_id IS 'Unique identifier for the origin analysis';
COMMENT ON COLUMN concept_origins.concept_id IS 'Reference to the concept';
COMMENT ON COLUMN concept_origins.parent_concepts IS 'Array of parent concept identifiers';
COMMENT ON COLUMN concept_origins.influence_weights IS 'Array of influence weights for each parent concept';
COMMENT ON COLUMN concept_origins.analysis IS 'Textual analysis of the concept origins';
COMMENT ON COLUMN concept_origins.detected_at IS 'Timestamp when the origin was detected';
COMMENT ON COLUMN concept_origins.interaction_id IS 'Reference to the Claude interaction that produced the analysis';

-- Commit transaction
COMMIT;
