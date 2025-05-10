-- Migration: Create concept_traditions table
-- Description: Creates the concept_traditions junction table to relate concepts and traditions

-- Begin transaction
BEGIN;

-- Create concept_traditions table (junction table)
CREATE TABLE IF NOT EXISTS concept_traditions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  concept_id UUID NOT NULL REFERENCES concepts(concept_id) ON DELETE CASCADE,
  tradition_id UUID NOT NULL REFERENCES traditions(tradition_id) ON DELETE CASCADE,
  relationship_strength FLOAT CHECK (relationship_strength >= 0 AND relationship_strength <= 1),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  -- Ensure the combination of concept_id and tradition_id is unique
  UNIQUE(concept_id, tradition_id)
);

-- Create indexes for performance
CREATE INDEX idx_concept_traditions_concept_id ON concept_traditions(concept_id);
CREATE INDEX idx_concept_traditions_tradition_id ON concept_traditions(tradition_id);
CREATE INDEX idx_concept_traditions_relationship_strength ON concept_traditions(relationship_strength);

-- Add table comments
COMMENT ON TABLE concept_traditions IS 'Junction table relating concepts to philosophical traditions';
COMMENT ON COLUMN concept_traditions.id IS 'Unique identifier for the relationship';
COMMENT ON COLUMN concept_traditions.concept_id IS 'Reference to the concept';
COMMENT ON COLUMN concept_traditions.tradition_id IS 'Reference to the tradition';
COMMENT ON COLUMN concept_traditions.relationship_strength IS 'Strength of the relationship (0-1)';
COMMENT ON COLUMN concept_traditions.metadata IS 'Additional metadata for the relationship';
COMMENT ON COLUMN concept_traditions.created_at IS 'Timestamp when the relationship was created';
COMMENT ON COLUMN concept_traditions.updated_at IS 'Timestamp when the relationship was last updated';

-- Create a trigger to automatically update the updated_at column
CREATE TRIGGER update_concept_traditions_updated_at
BEFORE UPDATE ON concept_traditions
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Commit transaction
COMMIT;
