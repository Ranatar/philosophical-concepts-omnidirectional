-- Migration: Create transformations table
-- Description: Creates the transformations table to track transformations between graphs and theses

-- Begin transaction
BEGIN;

-- Create source_type and target_type enums
CREATE TYPE source_type AS ENUM (
  'graph',
  'thesis',
  'concept'
);

CREATE TYPE target_type AS ENUM (
  'graph',
  'thesis',
  'concept'
);

-- Create transformations table
CREATE TABLE IF NOT EXISTS transformations (
  transformation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id UUID NOT NULL,
  source_type source_type NOT NULL,
  target_id UUID NOT NULL,
  target_type target_type NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  interaction_id UUID REFERENCES claude_interactions(interaction_id) ON DELETE SET NULL,
  transformation_details JSONB DEFAULT '{}'
);

-- Create indexes for performance
CREATE INDEX idx_transformations_source_id ON transformations(source_id);
CREATE INDEX idx_transformations_target_id ON transformations(target_id);
CREATE INDEX idx_transformations_source_type ON transformations(source_type);
CREATE INDEX idx_transformations_target_type ON transformations(target_type);
CREATE INDEX idx_transformations_created_at ON transformations(created_at);
CREATE INDEX idx_transformations_interaction_id ON transformations(interaction_id);

-- Add table comments
COMMENT ON TABLE transformations IS 'Tracks transformations between different entities (graphs, theses, concepts)';
COMMENT ON COLUMN transformations.transformation_id IS 'Unique identifier for the transformation';
COMMENT ON COLUMN transformations.source_id IS 'ID of the source entity';
COMMENT ON COLUMN transformations.source_type IS 'Type of the source entity';
COMMENT ON COLUMN transformations.target_id IS 'ID of the target entity';
COMMENT ON COLUMN transformations.target_type IS 'Type of the target entity';
COMMENT ON COLUMN transformations.created_at IS 'Timestamp when the transformation was created';
COMMENT ON COLUMN transformations.interaction_id IS 'Reference to the Claude interaction that produced the transformation';
COMMENT ON COLUMN transformations.transformation_details IS 'Details about the transformation process';

-- Commit transaction
COMMIT;
