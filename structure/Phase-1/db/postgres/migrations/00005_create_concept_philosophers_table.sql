-- Migration: Create concept_philosophers table
-- Description: Creates the concept_philosophers junction table to relate concepts and philosophers

-- Begin transaction
BEGIN;

-- Create concept_philosophers table (junction table)
CREATE TABLE IF NOT EXISTS concept_philosophers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  concept_id UUID NOT NULL REFERENCES concepts(concept_id) ON DELETE CASCADE,
  philosopher_id UUID NOT NULL REFERENCES philosophers(philosopher_id) ON DELETE CASCADE,
  relationship_type VARCHAR(100),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  -- Ensure the combination of concept_id and philosopher_id is unique
  UNIQUE(concept_id, philosopher_id)
);

-- Create indexes for performance
CREATE INDEX idx_concept_philosophers_concept_id ON concept_philosophers(concept_id);
CREATE INDEX idx_concept_philosophers_philosopher_id ON concept_philosophers(philosopher_id);
CREATE INDEX idx_concept_philosophers_relationship_type ON concept_philosophers(relationship_type);

-- Add table comments
COMMENT ON TABLE concept_philosophers IS 'Junction table relating concepts to philosophers';
COMMENT ON COLUMN concept_philosophers.id IS 'Unique identifier for the relationship';
COMMENT ON COLUMN concept_philosophers.concept_id IS 'Reference to the concept';
COMMENT ON COLUMN concept_philosophers.philosopher_id IS 'Reference to the philosopher';
COMMENT ON COLUMN concept_philosophers.relationship_type IS 'Type of relationship between the concept and philosopher';
COMMENT ON COLUMN concept_philosophers.metadata IS 'Additional metadata for the relationship';
COMMENT ON COLUMN concept_philosophers.created_at IS 'Timestamp when the relationship was created';
COMMENT ON COLUMN concept_philosophers.updated_at IS 'Timestamp when the relationship was last updated';

-- Create a trigger to automatically update the updated_at column
CREATE TRIGGER update_concept_philosophers_updated_at
BEFORE UPDATE ON concept_philosophers
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Commit transaction
COMMIT;
