-- Migration: Create concepts table
-- Description: Creates the concepts table to store philosophical concept metadata

-- Begin transaction
BEGIN;

-- Create enum for concept status
CREATE TYPE concept_status AS ENUM (
  'draft',
  'published',
  'archived',
  'deprecated'
);

-- Create concepts table
CREATE TABLE IF NOT EXISTS concepts (
  concept_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES users(user_id) ON DELETE RESTRICT,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  status concept_status NOT NULL DEFAULT 'draft',
  is_synthesis BOOLEAN NOT NULL DEFAULT FALSE,
  parent_concepts JSONB DEFAULT '[]',
  synthesis_method VARCHAR(100),
  focus VARCHAR(255),
  innovation_degree INTEGER CHECK (innovation_degree >= 0 AND innovation_degree <= 100),
  historical_context TEXT,
  metadata JSONB DEFAULT '{}',
  creation_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  last_modified TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_concepts_creator_id ON concepts(creator_id);
CREATE INDEX idx_concepts_name ON concepts(name);
CREATE INDEX idx_concepts_status ON concepts(status);
CREATE INDEX idx_concepts_is_synthesis ON concepts(is_synthesis);
CREATE INDEX idx_concepts_focus ON concepts(focus);
CREATE INDEX idx_concepts_innovation_degree ON concepts(innovation_degree);
CREATE INDEX idx_concepts_parent_concepts ON concepts USING GIN (parent_concepts);

-- Add table comments
COMMENT ON TABLE concepts IS 'Stores metadata about philosophical concepts';
COMMENT ON COLUMN concepts.concept_id IS 'Unique identifier for the concept';
COMMENT ON COLUMN concepts.creator_id IS 'Reference to the user who created the concept';
COMMENT ON COLUMN concepts.name IS 'Name of the philosophical concept';
COMMENT ON COLUMN concepts.description IS 'Description of the philosophical concept';
COMMENT ON COLUMN concepts.status IS 'Current status of the concept';
COMMENT ON COLUMN concepts.is_synthesis IS 'Whether the concept is a synthesis of other concepts';
COMMENT ON COLUMN concepts.parent_concepts IS 'Array of parent concept IDs for synthesized concepts';
COMMENT ON COLUMN concepts.synthesis_method IS 'Method used for synthesis if applicable';
COMMENT ON COLUMN concepts.focus IS 'Conceptual focus of the concept';
COMMENT ON COLUMN concepts.innovation_degree IS 'Degree of innovation on a scale of 0-100';
COMMENT ON COLUMN concepts.historical_context IS 'Historical context of the concept';
COMMENT ON COLUMN concepts.metadata IS 'Additional metadata for the concept';
COMMENT ON COLUMN concepts.creation_date IS 'Timestamp when the concept was created';
COMMENT ON COLUMN concepts.last_modified IS 'Timestamp when the concept was last modified';

-- Create a trigger to automatically update the last_modified column
CREATE TRIGGER update_concepts_last_modified
BEFORE UPDATE ON concepts
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Commit transaction
COMMIT;
