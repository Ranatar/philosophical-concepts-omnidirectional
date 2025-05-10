-- Migration: Create traditions table
-- Description: Creates the traditions table to store information about philosophical traditions

-- Begin transaction
BEGIN;

-- Create traditions table
CREATE TABLE IF NOT EXISTS traditions (
  tradition_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL UNIQUE,
  time_period VARCHAR(100),
  description TEXT,
  key_figures JSONB DEFAULT '[]',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_traditions_name ON traditions(name);
CREATE INDEX idx_traditions_time_period ON traditions(time_period);
CREATE INDEX idx_traditions_key_figures ON traditions USING GIN (key_figures);

-- Add table comments
COMMENT ON TABLE traditions IS 'Stores information about philosophical traditions';
COMMENT ON COLUMN traditions.tradition_id IS 'Unique identifier for the tradition';
COMMENT ON COLUMN traditions.name IS 'Name of the philosophical tradition';
COMMENT ON COLUMN traditions.time_period IS 'Historical time period of the tradition';
COMMENT ON COLUMN traditions.description IS 'Description and details of the tradition';
COMMENT ON COLUMN traditions.key_figures IS 'Array of key philosophers in this tradition';
COMMENT ON COLUMN traditions.metadata IS 'Additional metadata for the tradition';
COMMENT ON COLUMN traditions.created_at IS 'Timestamp when the tradition record was created';
COMMENT ON COLUMN traditions.updated_at IS 'Timestamp when the tradition record was last updated';

-- Create a trigger to automatically update the updated_at column
CREATE TRIGGER update_traditions_updated_at
BEFORE UPDATE ON traditions
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Commit transaction
COMMIT;
