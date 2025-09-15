-- Philosophy Service PostgreSQL Initialization Script
-- This script runs when the PostgreSQL container is first created

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Set default timezone
SET timezone = 'UTC';

-- Create custom types
CREATE TYPE user_role AS ENUM ('user', 'admin', 'moderator');
CREATE TYPE activity_type AS ENUM (
    'login',
    'logout',
    'create_concept',
    'update_concept',
    'delete_concept',
    'create_graph',
    'update_graph',
    'create_thesis',
    'update_thesis',
    'synthesize_concept',
    'analyze_name',
    'detect_origin',
    'claude_interaction'
);
CREATE TYPE query_type AS ENUM (
    'graph_validation',
    'graph_enrichment',
    'thesis_generation',
    'thesis_elaboration',
    'synthesis',
    'name_analysis',
    'origin_detection',
    'historical_context',
    'practical_application',
    'dialogue',
    'evolution'
);
CREATE TYPE synthesis_method AS ENUM (
    'dialectical',
    'complementary',
    'hierarchical',
    'hybrid'
);
CREATE TYPE relationship_type_enum AS ENUM (
    'hierarchical',
    'causal',
    'dialectical',
    'correlational',
    'disjunctive',
    'conjunctive',
    'contradiction',
    'complementary',
    'emergence',
    'necessary_condition',
    'sufficient_condition',
    'identity',
    'analogy',
    'implementation',
    'instantiation',
    'generalization',
    'part_whole',
    'means_end',
    'deductive',
    'inductive',
    'abductive',
    'temporal',
    'conceptual',
    'definitional',
    'manifestation',
    'foundational',
    'recognition',
    'reflexion',
    'development'
);
CREATE TYPE direction_type AS ENUM (
    'unidirectional',
    'bidirectional',
    'reflexive'
);

-- Create functions
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create indexes for better performance
-- These will be applied after tables are created in migrations

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE philosophy_db TO postgres;

-- Create schema for temporary data
CREATE SCHEMA IF NOT EXISTS temp_data;

-- Set search path
SET search_path TO public, temp_data;

-- Log successful initialization
DO $$
BEGIN
    RAISE NOTICE 'PostgreSQL initialization completed successfully at %', NOW();
END
$$;