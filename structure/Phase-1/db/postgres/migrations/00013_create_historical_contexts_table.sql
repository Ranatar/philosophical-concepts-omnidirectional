-- Migration: Create historical_contexts table
-- Description: Creates the historical_contexts table to store historical contextualization of concepts

-- Begin transaction
BEGIN;

-- Create historical_contexts table
CREATE TABLE IF NOT EXISTS historical_contexts (
  context_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  concept_id UUID NOT NULL REFERENCES concepts(concept_id) ON DELETE CASCADE,
  time_period VARCHAR(100) NOT NULL,
  historical_analysis TEXT NOT NULL,
  influences JSONB DEFAULT '[]',
  contemporaries JSONB DEFAULT '[]',
  subsequent_influence JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  interaction_id UUID REFERENCES claude_interactions(interaction_id) ON DELETE SET NULL
);

-- Create indexes for performance
CREATE INDEX idx_historical_contexts_concept_id ON historical_contexts(concept_id);
CREATE INDEX idx_historical_contexts_time_period ON historical_contexts(time_period);
CREATE INDEX idx_historical_contexts_created_at ON historical_contexts(created_at);
CREATE INDEX idx_historical_contexts_interaction_id ON historical_contexts(interaction_id);
CREATE INDEX idx_historical_contexts_influences ON historical_contexts USING GIN (influences);
CREATE INDEX idx_historical_contexts_contemporaries ON historical_contexts USING GIN (contemporaries);
CREATE INDEX idx_historical_contexts_subsequent_influence ON historical_contexts USING GIN (subsequent_influence);

-- Add table comments
COMMENT ON TABLE historical_contexts IS 'Stores historical contextualization of philosophical concepts';
COMMENT ON COLUMN historical_contexts.context_id IS 'Unique identifier for the historical context';
COMMENT ON COLUMN historical_contexts.concept_id IS 'Reference to the concept';
COMMENT ON COLUMN historical_contexts.time_period IS 'Historical time period relevant to the concept';
COMMENT ON COLUMN historical_contexts.historical_analysis IS 'Detailed historical analysis of the concept';
COMMENT ON COLUMN historical_contexts.influences IS 'Array of influences on the concept';
COMMENT ON COLUMN historical_contexts.contemporaries IS 'Array of contemporary concepts or philosophers';
COMMENT ON COLUMN historical_contexts.subsequent_influence IS 'Array of subsequent concepts influenced by this concept';
COMMENT ON COLUMN historical_contexts.created_at IS 'Timestamp when the historical context was created';
COMMENT ON COLUMN historical_contexts.interaction_id IS 'Reference to the Claude interaction that produced the analysis';

-- Commit transaction
COMMIT;
