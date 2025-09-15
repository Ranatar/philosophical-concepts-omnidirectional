-- Migration: 00010_create_concept_origins_table
-- Created at: 2024-01-01
-- Description: Create table for tracking concept origins and parent concept identification

-- Create concept_origins table
CREATE TABLE IF NOT EXISTS concept_origins (
    -- Primary key
    origin_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Foreign keys
    concept_id UUID NOT NULL REFERENCES concepts(concept_id) ON DELETE CASCADE,
    interaction_id UUID REFERENCES claude_interactions(interaction_id) ON DELETE SET NULL,
    
    -- Parent concepts (for non-synthesis concepts that were identified as derivatives)
    parent_concepts JSONB DEFAULT '[]'::jsonb, -- Array of {concept_id, name, influence_weight}
    
    -- Influence weights (must sum to 1.0)
    influence_weights JSONB DEFAULT '[]'::jsonb, -- Array of weights corresponding to parent_concepts
    
    -- Origin analysis
    analysis TEXT NOT NULL,
    origin_type VARCHAR(50) CHECK (origin_type IN (
        'original',          -- Completely original concept
        'derivative',        -- Derived from other concepts
        'synthesis',         -- Formal synthesis (already marked in concepts table)
        'interpretation',    -- New interpretation of existing concepts
        'application',       -- Application of concepts to new domain
        'critique',          -- Critical response to existing concepts
        'development',       -- Development/extension of existing concepts
        'combination'        -- Informal combination of concepts
    )),
    
    -- Detected influences
    detected_traditions TEXT[], -- Traditions detected as influences
    detected_philosophers TEXT[], -- Philosophers detected as influences
    detected_concepts TEXT[], -- Other concepts detected as influences
    
    -- Originality assessment
    originality_score DECIMAL(3,2) CHECK (originality_score >= 0 AND originality_score <= 1),
    innovation_aspects TEXT[], -- Aspects where the concept innovates
    traditional_aspects TEXT[], -- Aspects following tradition
    
    -- Synthesis detection (for concepts not marked as synthesis)
    is_hidden_synthesis BOOLEAN DEFAULT FALSE,
    synthesis_confidence DECIMAL(3,2) CHECK (synthesis_confidence >= 0 AND synthesis_confidence <= 1),
    suggested_synthesis_method synthesis_method_enum,
    
    -- Genealogy
    conceptual_lineage TEXT, -- Narrative description of conceptual lineage
    historical_precedents TEXT[], -- Historical concepts that preceded this
    contemporary_parallels TEXT[], -- Contemporary concepts with similarities
    
    -- Metadata
    is_current BOOLEAN DEFAULT TRUE,
    detected_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    confidence_level DECIMAL(3,2) DEFAULT 0.75 CHECK (confidence_level >= 0 AND confidence_level <= 1),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT chk_parent_concepts_format CHECK (jsonb_typeof(parent_concepts) = 'array'),
    CONSTRAINT chk_influence_weights_format CHECK (jsonb_typeof(influence_weights) = 'array'),
    CONSTRAINT chk_weights_match_parents CHECK (
        jsonb_array_length(parent_concepts) = jsonb_array_length(influence_weights)
    )
);

-- Create indexes
CREATE INDEX idx_concept_origins_concept_id ON concept_origins(concept_id);
CREATE INDEX idx_concept_origins_interaction_id ON concept_origins(interaction_id) WHERE interaction_id IS NOT NULL;
CREATE INDEX idx_concept_origins_is_current ON concept_origins(concept_id, is_current) WHERE is_current = TRUE;
CREATE INDEX idx_concept_origins_origin_type ON concept_origins(origin_type);
CREATE INDEX idx_concept_origins_is_hidden_synthesis ON concept_origins(is_hidden_synthesis) WHERE is_hidden_synthesis = TRUE;
CREATE INDEX idx_concept_origins_detected_at ON concept_origins(detected_at DESC);
CREATE INDEX idx_concept_origins_originality_score ON concept_origins(originality_score DESC);

-- Create GIN indexes for JSONB parent concepts search
CREATE INDEX idx_concept_origins_parent_concepts ON concept_origins USING GIN(parent_concepts);

-- Create trigger to update updated_at
CREATE TRIGGER update_concept_origins_updated_at 
    BEFORE UPDATE ON concept_origins
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create function to validate parent concepts and weights
CREATE OR REPLACE FUNCTION validate_origin_parents_weights()
RETURNS TRIGGER AS $$
DECLARE
    parent JSONB;
    weight JSONB;
    weight_sum DECIMAL(3,2);
    i INTEGER;
BEGIN
    -- Check that both are arrays
    IF jsonb_typeof(NEW.parent_concepts) != 'array' OR jsonb_typeof(NEW.influence_weights) != 'array' THEN
        RAISE EXCEPTION 'parent_concepts and influence_weights must be arrays';
    END IF;
    
    -- Check that arrays have same length
    IF jsonb_array_length(NEW.parent_concepts) != jsonb_array_length(NEW.influence_weights) THEN
        RAISE EXCEPTION 'parent_concepts and influence_weights must have the same length';
    END IF;
    
    -- If there are parent concepts, validate them
    IF jsonb_array_length(NEW.parent_concepts) > 0 THEN
        weight_sum := 0;
        
        -- Validate each parent concept and weight
        FOR i IN 0..jsonb_array_length(NEW.parent_concepts) - 1
        LOOP
            parent := NEW.parent_concepts->i;
            weight := NEW.influence_weights->i;
            
            -- Validate parent structure
            IF jsonb_typeof(parent) != 'object' THEN
                RAISE EXCEPTION 'Each parent concept must be an object';
            END IF;
            
            IF NOT (parent ? 'concept_id' AND parent ? 'name') THEN
                RAISE EXCEPTION 'Each parent concept must have concept_id and name';
            END IF;
            
            -- Validate weight is a number
            IF jsonb_typeof(weight) != 'number' THEN
                RAISE EXCEPTION 'Each influence weight must be a number';
            END IF;
            
            -- Add to sum
            weight_sum := weight_sum + (weight::text)::DECIMAL(3,2);
        END LOOP;
        
        -- Check that weights sum to 1.0 (with small tolerance for rounding)
        IF ABS(weight_sum - 1.0) > 0.01 THEN
            RAISE EXCEPTION 'Influence weights must sum to 1.0 (current sum: %)', weight_sum;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to validate parent concepts and weights
CREATE TRIGGER validate_concept_origins_parents
    BEFORE INSERT OR UPDATE ON concept_origins
    FOR EACH ROW
    EXECUTE FUNCTION validate_origin_parents_weights();

-- Create function to archive old origin analyses
CREATE OR REPLACE FUNCTION archive_old_origin_analyses()
RETURNS TRIGGER AS $$
BEGIN
    -- Set is_current to false for all other analyses of this concept
    UPDATE concept_origins
    SET is_current = FALSE
    WHERE concept_id = NEW.concept_id 
    AND origin_id != NEW.origin_id
    AND is_current = TRUE;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to manage current analysis
CREATE TRIGGER manage_current_origin_analysis
    AFTER INSERT ON concept_origins
    FOR EACH ROW
    WHEN (NEW.is_current = TRUE)
    EXECUTE FUNCTION archive_old_origin_analyses();

-- Create function to get parent concepts with details
CREATE OR REPLACE FUNCTION get_concept_parents(
    p_concept_id UUID
)
RETURNS TABLE(
    parent_concept_id UUID,
    parent_name VARCHAR(255),
    influence_weight DECIMAL(3,2),
    parent_description TEXT,
    relationship_type VARCHAR(50)
) AS $$
BEGIN
    RETURN QUERY
    WITH origin_data AS (
        SELECT 
            parent_obj->>'concept_id' AS parent_id,
            parent_obj->>'name' AS parent_name,
            (weight_obj::text)::DECIMAL(3,2) AS weight
        FROM concept_origins co,
             jsonb_array_elements(co.parent_concepts) WITH ORDINALITY AS parent(parent_obj, idx),
             jsonb_array_elements(co.influence_weights) WITH ORDINALITY AS weight(weight_obj, idx2)
        WHERE co.concept_id = p_concept_id 
        AND co.is_current = TRUE
        AND parent.idx = weight.idx2
    )
    SELECT 
        od.parent_id::UUID AS parent_concept_id,
        od.parent_name::VARCHAR(255),
        od.weight AS influence_weight,
        c.description AS parent_description,
        'identified_parent'::VARCHAR(50) AS relationship_type
    FROM origin_data od
    LEFT JOIN concepts c ON c.concept_id = od.parent_id::UUID
    ORDER BY od.weight DESC;
END;
$$ LANGUAGE plpgsql;

-- Create function to find concepts with similar origins
CREATE OR REPLACE FUNCTION find_concepts_with_similar_origins(
    p_concept_id UUID,
    p_min_similarity DECIMAL(3,2) DEFAULT 0.5
)
RETURNS TABLE(
    similar_concept_id UUID,
    similar_concept_name VARCHAR(255),
    similarity_score DECIMAL(3,2),
    shared_parents INTEGER,
    shared_traditions INTEGER
) AS $$
BEGIN
    RETURN QUERY
    WITH target_origin AS (
        SELECT 
            parent_concepts,
            detected_traditions
        FROM concept_origins
        WHERE concept_id = p_concept_id AND is_current = TRUE
        LIMIT 1
    ),
    similarity_calc AS (
        SELECT 
            co.concept_id,
            c.name,
            -- Calculate similarity based on shared parents
            (
                SELECT COUNT(*)
                FROM jsonb_array_elements(co.parent_concepts) p1
                JOIN jsonb_array_elements(to_parent.parent_concepts) p2 
                ON p1->>'concept_id' = p2->>'concept_id'
            ) AS shared_parent_count,
            -- Calculate similarity based on shared traditions
            COALESCE(
                array_length(
                    ARRAY(
                        SELECT unnest(co.detected_traditions) 
                        INTERSECT 
                        SELECT unnest(to_parent.detected_traditions)
                    ), 
                    1
                ), 
                0
            ) AS shared_tradition_count
        FROM concept_origins co
        CROSS JOIN target_origin to_parent
        JOIN concepts c ON c.concept_id = co.concept_id
        WHERE co.is_current = TRUE 
        AND co.concept_id != p_concept_id
        AND c.deleted_at IS NULL
    )
    SELECT 
        concept_id AS similar_concept_id,
        name AS similar_concept_name,
        LEAST(
            (shared_parent_count::DECIMAL + shared_tradition_count::DECIMAL) / 
            GREATEST(
                jsonb_array_length((SELECT parent_concepts FROM target_origin)) + 
                COALESCE(array_length((SELECT detected_traditions FROM target_origin), 1), 0),
                1
            ),
            1.0
        )::DECIMAL(3,2) AS similarity_score,
        shared_parent_count AS shared_parents,
        shared_tradition_count AS shared_traditions
    FROM similarity_calc
    WHERE (shared_parent_count + shared_tradition_count) > 0
    AND LEAST(
        (shared_parent_count::DECIMAL + shared_tradition_count::DECIMAL) / 
        GREATEST(
            jsonb_array_length((SELECT parent_concepts FROM target_origin)) + 
            COALESCE(array_length((SELECT detected_traditions FROM target_origin), 1), 0),
            1
        ),
        1.0
    ) >= p_min_similarity
    ORDER BY similarity_score DESC, name;
END;
$$ LANGUAGE plpgsql;

-- Create view for origin analysis summary
CREATE OR REPLACE VIEW concept_origin_summary AS
SELECT 
    c.concept_id,
    c.name AS concept_name,
    c.is_synthesis AS marked_as_synthesis,
    co.origin_type,
    co.originality_score,
    co.is_hidden_synthesis,
    co.synthesis_confidence,
    jsonb_array_length(co.parent_concepts) AS parent_count,
    array_length(co.detected_traditions, 1) AS tradition_influence_count,
    array_length(co.detected_philosophers, 1) AS philosopher_influence_count,
    co.detected_at,
    co.confidence_level
FROM concepts c
LEFT JOIN concept_origins co ON c.concept_id = co.concept_id AND co.is_current = TRUE
WHERE c.deleted_at IS NULL;

-- Add comments
COMMENT ON TABLE concept_origins IS 'Tracks the origins and influences of philosophical concepts';
COMMENT ON COLUMN concept_origins.origin_id IS 'Unique identifier for the origin analysis';
COMMENT ON COLUMN concept_origins.parent_concepts IS 'Array of parent concepts with their influence details';
COMMENT ON COLUMN concept_origins.influence_weights IS 'Weights showing relative influence of each parent';
COMMENT ON COLUMN concept_origins.origin_type IS 'Classification of how the concept originated';
COMMENT ON COLUMN concept_origins.originality_score IS 'Score indicating originality (0=derivative, 1=original)';
COMMENT ON COLUMN concept_origins.is_hidden_synthesis IS 'Whether concept appears to be synthesis but not marked as such';
COMMENT ON COLUMN concept_origins.synthesis_confidence IS 'Confidence that this is actually a synthesis';
COMMENT ON FUNCTION get_concept_parents IS 'Get detailed information about parent concepts';
COMMENT ON FUNCTION find_concepts_with_similar_origins IS 'Find concepts with similar origins or influences';
COMMENT ON VIEW concept_origin_summary IS 'Summary view of concept origins and influences';