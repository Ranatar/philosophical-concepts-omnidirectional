-- Migration: 00011_create_transformations_table
-- Created at: 2024-01-01
-- Description: Create table for tracking transformations between different representations (thesis <-> graph)

-- Create enum for transformation types
CREATE TYPE transformation_type AS ENUM (
    'thesis_to_graph',      -- Converting theses to graph structure
    'graph_to_thesis',      -- Generating theses from graph
    'graph_enrichment',     -- Enriching graph with additional details
    'thesis_elaboration',   -- Elaborating theses with more detail
    'concept_to_graph',     -- Initial graph creation from concept
    'concept_to_thesis',    -- Initial thesis generation from concept
    'synthesis_merge'       -- Merging multiple sources into synthesis
);

-- Create enum for source/target types
CREATE TYPE transform_entity_type AS ENUM (
    'concept',
    'graph',
    'thesis',
    'category',
    'relationship',
    'multiple'  -- For transformations involving multiple sources
);

-- Create transformations table
CREATE TABLE IF NOT EXISTS transformations (
    -- Primary key
    transformation_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Source information
    source_id UUID NOT NULL, -- ID of source entity
    source_type transform_entity_type NOT NULL,
    source_snapshot JSONB, -- Snapshot of source data at transformation time
    
    -- Target information
    target_id UUID NOT NULL, -- ID of target entity
    target_type transform_entity_type NOT NULL,
    target_snapshot JSONB, -- Snapshot of target data after transformation
    
    -- Transformation details
    transformation_type transformation_type NOT NULL,
    transformation_details JSONB DEFAULT '{}', -- Detailed transformation parameters
    
    -- Additional sources (for multi-source transformations)
    additional_sources JSONB DEFAULT '[]'::jsonb, -- Array of {id, type, snapshot}
    
    -- Claude interaction reference
    interaction_id UUID REFERENCES claude_interactions(interaction_id) ON DELETE SET NULL,
    
    -- Quality metrics
    confidence_score DECIMAL(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
    completeness_score DECIMAL(3,2) CHECK (completeness_score >= 0 AND completeness_score <= 1),
    accuracy_score DECIMAL(3,2) CHECK (accuracy_score >= 0 AND accuracy_score <= 1),
    
    -- Transformation metadata
    transformation_rules TEXT[], -- Rules applied during transformation
    elements_created INTEGER DEFAULT 0,
    elements_modified INTEGER DEFAULT 0,
    elements_removed INTEGER DEFAULT 0,
    
    -- Validation results
    validation_status VARCHAR(20) DEFAULT 'pending' CHECK (validation_status IN (
        'pending', 'validated', 'needs_review', 'rejected'
    )),
    validation_notes TEXT,
    validated_by UUID REFERENCES users(user_id),
    validated_at TIMESTAMP WITH TIME ZONE,
    
    -- User who initiated transformation
    created_by UUID NOT NULL REFERENCES users(user_id),
    
    -- Reversibility information
    is_reversible BOOLEAN DEFAULT FALSE,
    reverse_transformation_id UUID REFERENCES transformations(transformation_id),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT chk_source_target_different CHECK (
        source_id != target_id OR source_type != target_type
    ),
    CONSTRAINT chk_transformation_details CHECK (jsonb_typeof(transformation_details) = 'object'),
    CONSTRAINT chk_additional_sources CHECK (jsonb_typeof(additional_sources) = 'array')
);

-- Create indexes
CREATE INDEX idx_transformations_source ON transformations(source_id, source_type);
CREATE INDEX idx_transformations_target ON transformations(target_id, target_type);
CREATE INDEX idx_transformations_type ON transformations(transformation_type);
CREATE INDEX idx_transformations_interaction ON transformations(interaction_id) WHERE interaction_id IS NOT NULL;
CREATE INDEX idx_transformations_created_by ON transformations(created_by);
CREATE INDEX idx_transformations_created_at ON transformations(created_at DESC);
CREATE INDEX idx_transformations_validation_status ON transformations(validation_status);
CREATE INDEX idx_transformations_reverse ON transformations(reverse_transformation_id) WHERE reverse_transformation_id IS NOT NULL;

-- Create function to validate additional sources
CREATE OR REPLACE FUNCTION validate_transformation_sources()
RETURNS TRIGGER AS $$
DECLARE
    source JSONB;
BEGIN
    -- Validate additional_sources array
    IF jsonb_typeof(NEW.additional_sources) != 'array' THEN
        RAISE EXCEPTION 'additional_sources must be an array';
    END IF;
    
    -- Validate each additional source
    FOR source IN SELECT jsonb_array_elements(NEW.additional_sources)
    LOOP
        -- Each source should be an object
        IF jsonb_typeof(source) != 'object' THEN
            RAISE EXCEPTION 'Each additional source must be an object';
        END IF;
        
        -- Required fields
        IF NOT (source ? 'id' AND source ? 'type') THEN
            RAISE EXCEPTION 'Each additional source must have id and type';
        END IF;
        
        -- Validate type is valid
        IF NOT (source->>'type' IN ('concept', 'graph', 'thesis', 'category', 'relationship')) THEN
            RAISE EXCEPTION 'Invalid source type: %', source->>'type';
        END IF;
    END LOOP;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to validate sources
CREATE TRIGGER validate_transformations_sources
    BEFORE INSERT OR UPDATE ON transformations
    FOR EACH ROW
    WHEN (jsonb_array_length(NEW.additional_sources) > 0)
    EXECUTE FUNCTION validate_transformation_sources();

-- Create function to get transformation history for an entity
CREATE OR REPLACE FUNCTION get_transformation_history(
    p_entity_id UUID,
    p_entity_type transform_entity_type
)
RETURNS TABLE(
    transformation_id UUID,
    transformation_type transformation_type,
    direction VARCHAR(10),
    other_entity_id UUID,
    other_entity_type transform_entity_type,
    confidence_score DECIMAL(3,2),
    created_at TIMESTAMP WITH TIME ZONE,
    created_by_username VARCHAR(50)
) AS $$
BEGIN
    RETURN QUERY
    -- Transformations where entity is source
    SELECT 
        t.transformation_id,
        t.transformation_type,
        'from'::VARCHAR(10) AS direction,
        t.target_id AS other_entity_id,
        t.target_type AS other_entity_type,
        t.confidence_score,
        t.created_at,
        u.username AS created_by_username
    FROM transformations t
    JOIN users u ON t.created_by = u.user_id
    WHERE t.source_id = p_entity_id AND t.source_type = p_entity_type
    
    UNION ALL
    
    -- Transformations where entity is target
    SELECT 
        t.transformation_id,
        t.transformation_type,
        'to'::VARCHAR(10) AS direction,
        t.source_id AS other_entity_id,
        t.source_type AS other_entity_type,
        t.confidence_score,
        t.created_at,
        u.username AS created_by_username
    FROM transformations t
    JOIN users u ON t.created_by = u.user_id
    WHERE t.target_id = p_entity_id AND t.target_type = p_entity_type
    
    ORDER BY created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Create function to track transformation lineage
CREATE OR REPLACE FUNCTION get_transformation_lineage(
    p_entity_id UUID,
    p_entity_type transform_entity_type,
    p_max_depth INTEGER DEFAULT 5
)
RETURNS TABLE(
    level INTEGER,
    entity_id UUID,
    entity_type transform_entity_type,
    transformation_id UUID,
    transformation_type transformation_type,
    parent_entity_id UUID,
    parent_entity_type transform_entity_type
) AS $$
WITH RECURSIVE lineage AS (
    -- Base case: starting entity
    SELECT 
        0 AS level,
        p_entity_id AS entity_id,
        p_entity_type AS entity_type,
        NULL::UUID AS transformation_id,
        NULL::transformation_type AS transformation_type,
        NULL::UUID AS parent_entity_id,
        NULL::transform_entity_type AS parent_entity_type
    
    UNION ALL
    
    -- Recursive case: find sources
    SELECT 
        l.level + 1,
        t.source_id AS entity_id,
        t.source_type AS entity_type,
        t.transformation_id,
        t.transformation_type,
        l.entity_id AS parent_entity_id,
        l.entity_type AS parent_entity_type
    FROM lineage l
    JOIN transformations t ON t.target_id = l.entity_id AND t.target_type = l.entity_type
    WHERE l.level < p_max_depth
)
SELECT * FROM lineage
ORDER BY level, entity_id;
$$ LANGUAGE sql;

-- Create view for transformation statistics
CREATE OR REPLACE VIEW transformation_statistics AS
SELECT 
    transformation_type,
    COUNT(*) AS total_count,
    COUNT(DISTINCT created_by) AS unique_users,
    AVG(confidence_score) AS avg_confidence,
    AVG(completeness_score) AS avg_completeness,
    AVG(accuracy_score) AS avg_accuracy,
    COUNT(*) FILTER (WHERE validation_status = 'validated') AS validated_count,
    COUNT(*) FILTER (WHERE validation_status = 'rejected') AS rejected_count,
    COUNT(*) FILTER (WHERE is_reversible = TRUE) AS reversible_count,
    MAX(created_at) AS last_transformation
FROM transformations
GROUP BY transformation_type;

-- Create function to create reverse transformation
CREATE OR REPLACE FUNCTION create_reverse_transformation(
    p_transformation_id UUID,
    p_user_id UUID
)
RETURNS UUID AS $$
DECLARE
    v_original transformations%ROWTYPE;
    v_reverse_id UUID;
BEGIN
    -- Get original transformation
    SELECT * INTO v_original
    FROM transformations
    WHERE transformation_id = p_transformation_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Transformation not found: %', p_transformation_id;
    END IF;
    
    IF NOT v_original.is_reversible THEN
        RAISE EXCEPTION 'Transformation is not reversible: %', p_transformation_id;
    END IF;
    
    -- Create reverse transformation
    INSERT INTO transformations (
        source_id,
        source_type,
        source_snapshot,
        target_id,
        target_type,
        transformation_type,
        transformation_details,
        created_by,
        is_reversible,
        reverse_transformation_id,
        confidence_score
    ) VALUES (
        v_original.target_id,
        v_original.target_type,
        v_original.target_snapshot,
        v_original.source_id,
        v_original.source_type,
        -- Determine reverse type
        CASE v_original.transformation_type
            WHEN 'thesis_to_graph' THEN 'graph_to_thesis'::transformation_type
            WHEN 'graph_to_thesis' THEN 'thesis_to_graph'::transformation_type
            ELSE v_original.transformation_type
        END,
        jsonb_build_object(
            'is_reverse_of', v_original.transformation_id,
            'original_type', v_original.transformation_type
        ),
        p_user_id,
        FALSE, -- Reverse of reverse is not directly reversible
        v_original.transformation_id,
        v_original.confidence_score * 0.9 -- Slightly lower confidence for reverse
    ) RETURNING transformation_id INTO v_reverse_id;
    
    -- Update original to point to reverse
    UPDATE transformations
    SET reverse_transformation_id = v_reverse_id
    WHERE transformation_id = p_transformation_id
    AND reverse_transformation_id IS NULL;
    
    RETURN v_reverse_id;
END;
$$ LANGUAGE plpgsql;

-- Add comments
COMMENT ON TABLE transformations IS 'Tracks transformations between different representations of philosophical content';
COMMENT ON COLUMN transformations.transformation_id IS 'Unique identifier for the transformation';
COMMENT ON COLUMN transformations.source_id IS 'ID of the source entity';
COMMENT ON COLUMN transformations.source_type IS 'Type of the source entity';
COMMENT ON COLUMN transformations.source_snapshot IS 'Snapshot of source data at transformation time';
COMMENT ON COLUMN transformations.target_id IS 'ID of the target entity';
COMMENT ON COLUMN transformations.target_type IS 'Type of the target entity';
COMMENT ON COLUMN transformations.transformation_type IS 'Type of transformation performed';
COMMENT ON COLUMN transformations.additional_sources IS 'Additional source entities for multi-source transformations';
COMMENT ON COLUMN transformations.is_reversible IS 'Whether this transformation can be reversed';
COMMENT ON FUNCTION get_transformation_history IS 'Get all transformations involving a specific entity';
COMMENT ON FUNCTION get_transformation_lineage IS 'Trace the lineage of transformations for an entity';
COMMENT ON FUNCTION create_reverse_transformation IS 'Create a reverse transformation';
COMMENT ON VIEW transformation_statistics IS 'Statistics about different types of transformations';