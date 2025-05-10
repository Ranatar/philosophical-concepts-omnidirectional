-- Migration: Create philosophers table
-- Description: Creates the philosophers table to store information about philosophers

-- Begin transaction
BEGIN;

-- Create philosophers table
CREATE TABLE IF NOT EXISTS philosophers (
  philosopher_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  birth_year INTEGER,
  death_year INTEGER,
  description TEXT,
  traditions JSONB DEFAULT '[]',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_philosophers_name ON philosophers(name);
CREATE INDEX idx_philosophers_birth_year ON philosophers(birth_year);
CREATE INDEX idx_philosophers_death_year ON philosophers(death_year);
CREATE INDEX idx_philosophers_traditions ON philosophers USING GIN (traditions);

-- Add table comments
COMMENT ON TABLE philosophers IS 'Stores information about philosophers';
COMMENT ON COLUMN philosophers.philosopher_id IS 'Unique identifier for the philosopher';
COMMENT ON COLUMN philosophers.name IS 'Name of the philosopher';
COMMENT ON COLUMN philosophers.birth_year IS 'Year of birth of the philosopher';
COMMENT ON COLUMN philosophers.death_year IS 'Year of death of the philosopher (null if still alive)';
COMMENT ON COLUMN philosophers.description IS 'Description and biographical details of the philosopher';
COMMENT ON COLUMN philosophers.traditions IS 'Array of philosophical traditions associated with the philosopher';
COMMENT ON COLUMN philosophers.metadata IS 'Additional metadata for the philosopher';
COMMENT ON COLUMN philosophers.created_at IS 'Timestamp when the philosopher record was created';
COMMENT ON COLUMN philosophers.updated_at IS 'Timestamp when the philosopher record was last updated';

-- Create a trigger to automatically update the updated_at column
CREATE TRIGGER update_philosophers_updated_at
BEFORE UPDATE ON philosophers
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Commit transaction
COMMIT;
