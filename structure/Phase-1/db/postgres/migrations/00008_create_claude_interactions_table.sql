-- Migration: Create claude_interactions table
-- Description: Creates the claude_interactions table to store interactions with Claude API

-- Begin transaction
BEGIN;

-- Create query_type enum
CREATE TYPE query_type AS ENUM (
  'graph_validation',
  'graph_enrichment',
  'category_description',
  'relationship_description',
  'thesis_generation',
  'thesis_elaboration',
  'graph_from_thesis',
  'synthesis',
  'compatibility_analysis',
  'synthesis_critique',
  'name_analysis',
  'origin_detection',
  'historical_context',
  'practical_application',
  'dialogue_generation',
  'evolution_analysis',
  'general_query'
);

-- Create claude_interactions table
CREATE TABLE IF NOT EXISTS claude_interactions (
  interaction_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  concept_id UUID REFERENCES concepts(concept_id) ON DELETE SET NULL,
  query_type query_type NOT NULL,
  query_content TEXT NOT NULL,
  response_content TEXT,
  interaction_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  processing_time FLOAT,
  metadata JSONB DEFAULT '{}'
);

-- Create indexes for performance
CREATE INDEX idx_claude_interactions_user_id ON claude_interactions(user_id);
CREATE INDEX idx_claude_interactions_concept_id ON claude_interactions(concept_id);
CREATE INDEX idx_claude_interactions_query_type ON claude_interactions(query_type);
CREATE INDEX idx_claude_interactions_interaction_date ON claude_interactions(interaction_date);

-- Add table comments
COMMENT ON TABLE claude_interactions IS 'Stores interactions with Claude API for tracking and analysis';
COMMENT ON COLUMN claude_interactions.interaction_id IS 'Unique identifier for the interaction';
COMMENT ON COLUMN claude_interactions.user_id IS 'Reference to the user who initiated the interaction';
COMMENT ON COLUMN claude_interactions.concept_id IS 'Reference to the concept involved in the interaction (optional)';
COMMENT ON COLUMN claude_interactions.query_type IS 'Type of query sent to Claude API';
COMMENT ON COLUMN claude_interactions.query_content IS 'Content of the query sent to Claude API';
COMMENT ON COLUMN claude_interactions.response_content IS 'Content of the response from Claude API';
COMMENT ON COLUMN claude_interactions.interaction_date IS 'Timestamp when the interaction occurred';
COMMENT ON COLUMN claude_interactions.processing_time IS 'Time in seconds for processing the query';
COMMENT ON COLUMN claude_interactions.metadata IS 'Additional metadata about the interaction';

-- Commit transaction
COMMIT;
