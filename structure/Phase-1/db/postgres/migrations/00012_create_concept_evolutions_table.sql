-- Migration: 00012_create_concept_evolutions_table
-- Created at: 2024-01-01
-- Description: Create table for tracking concept evolution analysis and suggestions

-- Create enum for evolution direction types
CREATE TYPE evolution_direction AS ENUM (
    'modernization',      -- Updating concept for modern context
    'specialization',     -- Narrowing focus to specific domain
    'generalization',     -- Broadening scope
    'synthesis',          -- Combining with other concepts
    'deconstruction',     -- Breaking down into components
    'recontextualization', -- Placing in new context
    'formalization',      -- Making more rigorous
    'pragmatization',     -- Making more practical
    'critique',           -- Critical transformation
    'dialectical'         -- Dialectical development
);

-- Create concept_evolutions table
CREATE TABLE IF NOT EXISTS concept_evolutions (
    -- Primary key
    evolution_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Foreign keys
    concept_id UUID NOT NULL REFERENCES concepts(concept_id) ON DELETE CASCADE,
    target_concept_id UUID REFERENCES concepts(concept_id) ON DELETE SET NULL, -- If evolution created new concept
    interaction_id UUID REFERENCES claude_interactions(interaction_id) ON DELETE SET NULL,
    
    -- Evolution context
    evolution_context TEXT NOT NULL, -- Why evolution is being considered
    contemporary_relevance TEXT, -- How concept relates to contemporary issues
    scientific_updates TEXT, -- Relevant scientific discoveries
    cultural_shifts TEXT, -- Relevant cultural changes
    
    -- Suggested changes
    suggested_changes JSONB NOT NULL DEFAULT '{}', -- Detailed changes structure
    
    -- Evolution direction and method
    primary_direction evolution_direction NOT NULL,
    secondary_directions evolution_direction[],
    evolution_rationale TEXT NOT NULL,
    
    -- Name evolution
    suggested_name VARCHAR(255),
    name_rationale TEXT,
    name_preserves_essence BOOLEAN DEFAULT TRUE,
    
    -- Category changes
    categories_to_add JSONB DEFAULT '[]'::jsonb, -- Array of {name, definition, rationale}
    categories_to_modify JSONB DEFAULT '[]'::jsonb, -- Array of {id, changes, rationale}
    categories_to_remove JSONB DEFAULT '[]'::jsonb, -- Array of {id, rationale}
    
    -- Relationship changes
    relationships_to_add JSONB DEFAULT '[]'::jsonb, -- Array of new relationships
    relationships_to_modify JSONB DEFAULT '[]'::jsonb, -- Array of relationship modifications
    relationships_to_remove JSONB DEFAULT '[]'::jsonb, -- Array of relationships to remove
    
    -- Thesis evolution
    thesis_updates JSONB DEFAULT '[]'::jsonb, -- Array of {original, evolved, rationale}
    new_thesis_areas TEXT[], -- New areas needing theses
    
    -- Impact assessment
    philosophical_impact TEXT,
    practical_impact TEXT,
    preservation_score DECIMAL(3,2) CHECK (preservation_score >= 0 AND preservation_score <= 1), -- How much original is preserved
    innovation_score DECIMAL(3,2) CHECK (innovation_score >= 0 AND innovation_score <= 1),
    coherence_score DECIMAL(3,2) CHECK (coherence_score >= 0 AND coherence_score <= 1),
    
    -- Implementation status
    status VARCHAR(20) DEFAULT 'suggested' CHECK (status IN (
        'suggested', 'reviewing', 'approved', 'partially_implemented', 'fully_implemented', 'rejected'
    )),
    implementation_notes TEXT,
    
    -- Review and approval
    reviewed_by UUID REFERENCES users(user_id),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    review_comments TEXT,
    
    -- Metadata
    is_current BOOLEAN DEFAULT TRUE, -- Latest evolution analysis for concept
    confidence_level DECIMAL(3,2) DEFAULT 0.75 CHECK (confidence_level >= 0 AND confidence_level <= 1),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    implemented_at TIMESTAMP WITH TIME ZONE,
    
    -- Constraints
    CONSTRAINT chk_suggested_changes CHECK (jsonb_typeof(suggested_changes) = 'object'),
    CONSTRAINT chk_categories_arrays CHECK (
        jsonb_typeof(categories_to_add) = 'array' AND
        jsonb_typeof(categories_to_modify) = 'array' AND
        jsonb_typeof(categories_to_remove) = 'array'
    ),
    CONSTRAINT chk_relationships_arrays CHECK (
        jsonb_typeof(relationships_to_add) = 'array' AND
        jsonb_typeof(relationships_to_modify) = 'array' AND
        jsonb_typeof(relationships_to_remove) = 'array'
    ),
    CONSTRAINT chk_thesis_updates CHECK (jsonb_typeof(thesis_updates) = 'array')
);

-- Create indexes
CREATE INDEX idx_concept_evolutions_concept_id ON concept_evolutions(concept_id);
CREATE INDEX idx_concept_evolutions_target_concept ON concept_evolutions(target_concept_id) WHERE target_concept_id IS NOT NULL;
CREATE INDEX idx_concept_evolutions_interaction ON concept_evolutions(interaction_id) WHERE interaction_id IS NOT NULL;
CREATE INDEX idx_concept_evolutions_direction ON concept_evolutions(primary_direction);
CREATE INDEX idx_concept_evolutions_status ON concept_evolutions(status);
CREATE INDEX idx_concept_evolutions_is_current ON concept_evolutions(concept_id, is_current) WHERE is_current = TRUE;
CREATE INDEX idx_concept_evolutions_created_at ON concept_evolutions(created_at DESC);
CREATE INDEX idx_concept_evolutions_reviewed_by ON concept_evolutions(reviewed_by) WHERE reviewed_by IS NOT NULL;

-- Create trigger to update updated_at
CREATE TRIGGER update_concept_evolutions_updated_at 
    BEFORE UPDATE ON concept_evolutions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create function to validate evolution changes structure
CREATE OR REPLACE FUNCTION validate_evolution_changes()
RETURNS TRIGGER AS $$
DECLARE
    category JSONB;
    relationship JSONB;
    thesis JSONB;
BEGIN
    -- Validate categories_to_add
    FOR category IN SELECT jsonb_array_elements(NEW.categories_to_add)
    LOOP
        IF NOT (category ? 'name' AND category ? 'definition') THEN
            RAISE EXCEPTION 'Each category to add must have name and definition';
        END IF;
    END LOOP;
    
    -- Validate categories_to_modify
    FOR category IN SELECT jsonb_array_elements(NEW.categories_to_modify)
    LOOP
        IF NOT (category ? 'id' AND category ? 'changes') THEN
            RAISE EXCEPTION 'Each category to modify must have id and changes';
        END IF;
    END LOOP;
    
    -- Validate categories_to_remove
    FOR category IN SELECT jsonb_array_elements(NEW.categories_to_remove)
    LOOP
        IF NOT (category ? 'id' AND category ? 'rationale') THEN
            RAISE EXCEPTION 'Each category to remove must have id and rationale';
        END IF;
    END LOOP;
    
    -- Validate thesis_updates
    FOR thesis IN SELECT jsonb_array_elements(NEW.thesis_updates)
    LOOP
        IF NOT (thesis ? 'original' AND thesis ? 'evolved') THEN
            RAISE EXCEPTION 'Each thesis update must have original and evolved versions';
        END IF;
    END LOOP;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to validate changes
CREATE TRIGGER validate_concept_evolutions_changes
    BEFORE INSERT OR UPDATE ON concept_evolutions
    FOR EACH ROW
    EXECUTE FUNCTION validate_evolution_changes();

-- Create function to archive old evolution analyses
CREATE OR REPLACE FUNCTION archive_old_evolution_analyses()
RETURNS TRIGGER AS $$
BEGIN
    -- Set is_current to false for all other analyses of this concept
    UPDATE concept_evolutions
    SET is_current = FALSE
    WHERE concept_id = NEW.concept_id 
    AND evolution_id != NEW.evolution_id
    AND is_current = TRUE;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to manage current analysis
CREATE TRIGGER manage_current_evolution_analysis
    AFTER INSERT ON concept_evolutions
    FOR EACH ROW
    WHEN (NEW.is_current = TRUE)
    EXECUTE FUNCTION archive_old_evolution_analyses();

-- Create function to get evolution summary
CREATE OR REPLACE FUNCTION get_evolution_summary(
    p_concept_id UUID
)
RETURNS TABLE(
    evolution_id UUID,
    primary_direction evolution_direction,
    suggested_name VARCHAR(255),
    categories_change_count INTEGER,
    relationships_change_count INTEGER,
    thesis_change_count INTEGER,
    preservation_score DECIMAL(3,2),
    innovation_score DECIMAL(3,2),
    status VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ce.evolution_id,
        ce.primary_direction,
        ce.suggested_name,
        (jsonb_array_length(ce.categories_to_add) + 
         jsonb_array_length(ce.categories_to_modify) + 
         jsonb_array_length(ce.categories_to_remove)) AS categories_change_count,
        (jsonb_array_length(ce.relationships_to_add) + 
         jsonb_array_length(ce.relationships_to_modify) + 
         jsonb_array_length(ce.relationships_to_remove)) AS relationships_change_count,
        jsonb_array_length(ce.thesis_updates) AS thesis_change_count,
        ce.preservation_score,
        ce.innovation_score,
        ce.status,
        ce.created_at
    FROM concept_evolutions ce
    WHERE ce.concept_id = p_concept_id
    ORDER BY ce.is_current DESC, ce.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Create function to apply evolution changes
CREATE OR REPLACE FUNCTION apply_evolution_changes(
    p_evolution_id UUID,
    p_user_id UUID,
    p_create_new_concept BOOLEAN DEFAULT FALSE
)
RETURNS UUID AS $$
DECLARE
    v_evolution concept_evolutions%ROWTYPE;
    v_target_concept_id UUID;
    v_transformation_id UUID;
BEGIN
    -- Get evolution details
    SELECT * INTO v_evolution
    FROM concept_evolutions
    WHERE evolution_id = p_evolution_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Evolution not found: %', p_evolution_id;
    END IF;
    
    IF v_evolution.status NOT IN ('approved', 'partially_implemented') THEN
        RAISE EXCEPTION 'Evolution must be approved before implementation';
    END IF;
    
    -- Determine target concept
    IF p_create_new_concept THEN
        -- Create new evolved concept
        INSERT INTO concepts (
            creator_id,
            name,
            description,
            is_synthesis,
            parent_concepts,
            synthesis_method,
            focus,
            innovation_degree
        ) VALUES (
            p_user_id,
            COALESCE(v_evolution.suggested_name, 
                     (SELECT name || ' (Evolved)' FROM concepts WHERE concept_id = v_evolution.concept_id)),
            'Evolved from concept ' || v_evolution.concept_id,
            TRUE,
            jsonb_build_array(v_evolution.concept_id),
            'dialectical'::synthesis_method_enum,
            (SELECT focus FROM concepts WHERE concept_id = v_evolution.concept_id),
            '4'::innovation_degree_enum
        ) RETURNING concept_id INTO v_target_concept_id;
        
        -- Update evolution record
        UPDATE concept_evolutions
        SET target_concept_id = v_target_concept_id
        WHERE evolution_id = p_evolution_id;
    ELSE
        v_target_concept_id := v_evolution.concept_id;
    END IF;
    
    -- Record transformation
    INSERT INTO transformations (
        source_id,
        source_type,
        target_id,
        target_type,
        transformation_type,
        transformation_details,
        created_by,
        confidence_score
    ) VALUES (
        v_evolution.concept_id,
        'concept'::transform_entity_type,
        v_target_concept_id,
        'concept'::transform_entity_type,
        'concept_to_graph'::transformation_type,
        jsonb_build_object(
            'evolution_id', v_evolution.evolution_id,
            'direction', v_evolution.primary_direction,
            'changes_applied', v_evolution.suggested_changes
        ),
        p_user_id,
        v_evolution.confidence_level
    ) RETURNING transformation_id INTO v_transformation_id;
    
    -- Update evolution status
    UPDATE concept_evolutions
    SET 
        status = 'fully_implemented',
        implemented_at = CURRENT_TIMESTAMP,
        implementation_notes = 'Applied via function with transformation ' || v_transformation_id
    WHERE evolution_id = p_evolution_id;
    
    -- Note: Actual application of changes to graph, theses, etc. 
    -- would be handled by the respective services
    
    RETURN v_target_concept_id;
END;
$$ LANGUAGE plpgsql;

-- Create view for evolution statistics
CREATE OR REPLACE VIEW evolution_statistics AS
SELECT 
    primary_direction,
    COUNT(*) AS total_evolutions,
    COUNT(*) FILTER (WHERE status = 'fully_implemented') AS implemented_count,
    COUNT(*) FILTER (WHERE status = 'rejected') AS rejected_count,
    AVG(preservation_score) AS avg_preservation,
    AVG(innovation_score) AS avg_innovation,
    AVG(coherence_score) AS avg_coherence,
    COUNT(DISTINCT concept_id) AS unique_concepts
FROM concept_evolutions
GROUP BY primary_direction;

-- Add comments
COMMENT ON TABLE concept_evolutions IS 'Tracks evolution analysis and suggestions for philosophical concepts';
COMMENT ON COLUMN concept_evolutions.evolution_id IS 'Unique identifier for the evolution analysis';
COMMENT ON COLUMN concept_evolutions.evolution_context IS 'Context explaining why evolution is considered';
COMMENT ON COLUMN concept_evolutions.suggested_changes IS 'Detailed structure of all suggested changes';
COMMENT ON COLUMN concept_evolutions.primary_direction IS 'Main direction of evolution';
COMMENT ON COLUMN concept_evolutions.preservation_score IS 'How much of original concept is preserved (0-1)';
COMMENT ON COLUMN concept_evolutions.innovation_score IS 'Degree of innovation in evolution (0-1)';
COMMENT ON COLUMN concept_evolutions.coherence_score IS 'Internal coherence of evolved concept (0-1)';
COMMENT ON FUNCTION get_evolution_summary IS 'Get summary of all evolution analyses for a concept';
COMMENT ON FUNCTION apply_evolution_changes IS 'Apply approved evolution changes to create evolved concept';
COMMENT ON VIEW evolution_statistics IS 'Statistics about concept evolution patterns';