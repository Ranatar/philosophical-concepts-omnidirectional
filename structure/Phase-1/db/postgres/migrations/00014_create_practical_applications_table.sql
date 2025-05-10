-- Migration: Create practical_applications table
-- Description: Creates the practical_applications table to store practical applications of concepts

-- Begin transaction
BEGIN;

-- Create practical_applications table
CREATE TABLE IF NOT EXISTS practical_applications (
  application_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  concept_id UUID NOT NULL REFERENCES concepts(concept_id) ON DELETE CASCADE,
  domains JSONB DEFAULT '[]',
  application_analysis TEXT NOT NULL,
  implementation_methods JSONB DEFAULT '[]',
  relevance_mappings JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  interaction_id UUID REFERENCES claude_interactions(interaction_id) ON DELETE SET NULL
);

-- Create indexes for performance
CREATE INDEX idx_practical_applications_concept_id ON practical_applications(concept_id);
CREATE INDEX idx_practical_applications_created_at ON practical_applications(created_at);
CREATE INDEX idx_practical_applications_interaction_id ON practical_applications(interaction_id);
CREATE INDEX idx_practical_applications_domains ON practical_applications USING GIN (domains);
CREATE INDEX idx_practical_applications_implementation_methods ON practical_applications USING GIN (implementation_methods);
CREATE INDEX idx_practical_applications_relevance_mappings ON practical_applications USING GIN (relevance_mappings);

-- Add table comments
COMMENT ON TABLE practical_applications IS 'Stores practical applications of philosophical concepts';
COMMENT ON COLUMN practical_applications.application_id IS 'Unique identifier for the practical application';
COMMENT ON COLUMN practical_applications.concept_id IS 'Reference to the concept';
COMMENT ON COLUMN practical_applications.domains IS 'Array of domains where the concept can be applied';
COMMENT ON COLUMN practical_applications.application_analysis IS 'Detailed analysis of practical applications';
COMMENT ON COLUMN practical_applications.implementation_methods IS 'Array of methods for implementing the concept';
COMMENT ON COLUMN practical_applications.relevance_mappings IS 'Mappings of concept elements to relevant applications';
COMMENT ON COLUMN practical_applications.created_at IS 'Timestamp when the practical application was created';
COMMENT ON COLUMN practical_applications.interaction_id IS 'Reference to the Claude interaction that produced the analysis';

-- Commit transaction
COMMIT;
