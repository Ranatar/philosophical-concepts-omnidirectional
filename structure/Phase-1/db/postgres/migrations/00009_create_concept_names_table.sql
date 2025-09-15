-- Migration: 00009_create_concept_names_table
-- Created at: 2024-01-01
-- Description: Create table for concept name analysis and alternatives

-- Create concept_names table
CREATE TABLE IF NOT EXISTS concept_names (
    -- Primary key
    name_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Foreign keys
    concept_id UUID NOT NULL REFERENCES concepts(concept_id) ON DELETE CASCADE,
    interaction_id UUID REFERENCES claude_interactions(interaction_id) ON DELETE SET NULL,
    
    -- Current name information
    current_name VARCHAR(255) NOT NULL,
    
    -- Analysis results
    analysis TEXT NOT NULL,
    name_accuracy_score DECIMAL(3,2) CHECK (name_accuracy_score >= 0 AND name_accuracy_score <= 1),
    
    -- Name characteristics
    emphasizes_aspects TEXT[], -- Aspects the name emphasizes
    obscures_aspects TEXT[],   -- Aspects the name obscures or downplays
    linguistic_roots TEXT,      -- Etymology and linguistic analysis
    cultural_context TEXT,      -- Cultural considerations
    
    -- Alternative names
    alternative_names JSONB DEFAULT '[]'::jsonb, -- Array of {name, rationale, emphasis}
    
    -- Recommendations
    recommended_name VARCHAR(255),
    recommendation_rationale TEXT,
    
    -- Name evaluation criteria scores (0-1 scale)
    clarity_score DECIMAL(3,2) CHECK (clarity_score >= 0 AND clarity_score <= 1),
    precision_score DECIMAL(3,2) CHECK (precision_score >= 0 AND precision_score <= 1),
    completeness_score DECIMAL(3,2) CHECK (completeness_score >= 0 AND completeness_score <= 1),
    accessibility_score DECIMAL(3,2) CHECK (accessibility_score >= 0 AND accessibility_score <= 1),
    
    -- Historical context
    historical_names TEXT[], -- Names used historically for similar concepts
    contemporary_usage TEXT, -- How the name is used in contemporary discourse
    
    -- Metadata
    is_current BOOLEAN DEFAULT TRUE, -- Whether this is the current analysis
    analyzed_by VARCHAR(50) DEFAULT 'claude', -- System that performed analysis
    confidence_level DECIMAL(3,2) DEFAULT 0.80 CHECK (confidence_level >= 0 AND confidence_level <= 1),
    
    -- Timestamps
    analyzed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT chk_alternative_names_format CHECK (jsonb_typeof(alternative_names) = 'array'),
    CONSTRAINT chk_current_name_not_empty CHECK (trim(current_name) != ''),
    CONSTRAINT chk_recommended_name_not_empty CHECK (recommended_name IS NULL OR trim(recommended_name) != '')
);

-- Create indexes
CREATE INDEX idx_concept_names_concept_id ON concept_names(concept_id);
CREATE INDEX idx_concept_names_interaction_id ON concept_names(interaction_id) WHERE interaction_id IS NOT NULL;
CREATE INDEX idx_concept_names_is_current ON concept_names(concept_id, is_current) WHERE is_current = TRUE;
CREATE INDEX idx_concept_names_analyzed_at ON concept_names(analyzed_at DESC);
CREATE INDEX idx_concept_names_current_name ON concept_names(current_name);
CREATE INDEX idx_concept_names_recommended_name ON concept_names(recommended_name) WHERE recommended_name IS NOT NULL;

-- Create trigger to update updated_at
CREATE TRIGGER update_concept_names_updated_at 
    BEFORE UPDATE ON concept_names
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create function to validate alternative names structure
CREATE OR REPLACE FUNCTION validate_alternative_names()
RETURNS TRIGGER AS $$
DECLARE
    alt_name JSONB;
BEGIN
    -- Check that alternative_names is an array
    IF jsonb_typeof(NEW.alternative_names) != 'array' THEN
        RAISE EXCEPTION 'alternative_names must be an array';
    END IF;
    
    -- Validate each alternative name
    FOR alt_name IN SELECT jsonb_array_elements(NEW.alternative_names)
    LOOP
        -- Each alternative should be an object
        IF jsonb_typeof(alt_name) != 'object' THEN
            RAISE EXCEPTION 'Each alternative name must be an object';
        END IF;
        
        -- Required fields
        IF NOT (alt_name ? 'name' AND alt_name ? 'rationale') THEN
            RAISE EXCEPTION 'Each alternative name must have name and rationale';
        END IF;
        
        -- Validate name is not empty
        IF trim(alt_name->>'name') = '' THEN
            RAISE EXCEPTION 'Alternative name cannot be empty';
        END IF;
    END LOOP;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to validate alternative names
CREATE TRIGGER validate_concept_names_alternatives
    BEFORE INSERT OR UPDATE ON concept_names
    FOR EACH ROW
    WHEN (NEW.alternative_names IS NOT NULL)
    EXECUTE FUNCTION validate_alternative_names();

-- Create function to archive old analyses when new one is created
CREATE OR REPLACE FUNCTION archive_old_name_analyses()
RETURNS TRIGGER AS $$
BEGIN
    -- Set is_current to false for all other analyses of this concept
    UPDATE concept_names
    SET is_current = FALSE
    WHERE concept_id = NEW.concept_id 
    AND name_id != NEW.name_id
    AND is_current = TRUE;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to manage current analysis
CREATE TRIGGER manage_current_name_analysis
    AFTER INSERT ON concept_names
    FOR EACH ROW
    WHEN (NEW.is_current = TRUE)
    EXECUTE FUNCTION archive_old_name_analyses();

-- Create function to get name evolution history
CREATE OR REPLACE FUNCTION get_concept_name_history(
    p_concept_id UUID
)
RETURNS TABLE(
    name_id UUID,
    name_used VARCHAR(255),
    recommended_name VARCHAR(255),
    accuracy_score DECIMAL(3,2),
    analyzed_at TIMESTAMP WITH TIME ZONE,
    was_adopted BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    WITH name_changes AS (
        SELECT 
            cn.name_id,
            cn.current_name AS name_used,
            cn.recommended_name,
            cn.name_accuracy_score AS accuracy_score,
            cn.analyzed_at,
            -- Check if recommendation was adopted
            LEAD(cn.current_name) OVER (ORDER BY cn.analyzed_at) = cn.recommended_name AS was_adopted
        FROM concept_names cn
        WHERE cn.concept_id = p_concept_id
        ORDER BY cn.analyzed_at DESC
    )
    SELECT * FROM name_changes;
END;
$$ LANGUAGE plpgsql;

-- Create function to compare names across concepts
CREATE OR REPLACE FUNCTION find_similar_concept_names(
    p_name VARCHAR(255),
    p_threshold DECIMAL(3,2) DEFAULT 0.7
)
RETURNS TABLE(
    concept_id UUID,
    concept_name VARCHAR(255),
    similarity_score DECIMAL(3,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.concept_id,
        c.name AS concept_name,
        similarity(c.name, p_name)::DECIMAL(3,2) AS similarity_score
    FROM concepts c
    WHERE 
        c.deleted_at IS NULL AND
        similarity(c.name, p_name) >= p_threshold
    ORDER BY similarity_score DESC, c.name;
END;
$$ LANGUAGE plpgsql;

-- Create view for name analysis summary
CREATE OR REPLACE VIEW concept_name_summary AS
SELECT 
    c.concept_id,
    c.name AS current_concept_name,
    cn.current_name AS analyzed_name,
    cn.recommended_name,
    cn.name_accuracy_score,
    cn.clarity_score,
    cn.precision_score,
    cn.completeness_score,
    cn.accessibility_score,
    (cn.clarity_score + cn.precision_score + cn.completeness_score + cn.accessibility_score) / 4 AS overall_score,
    cn.analyzed_at,
    jsonb_array_length(cn.alternative_names) AS alternative_count,
    cn.is_current
FROM concepts c
LEFT JOIN concept_names cn ON c.concept_id = cn.concept_id AND cn.is_current = TRUE
WHERE c.deleted_at IS NULL;

-- Create function to get best alternative names
CREATE OR REPLACE FUNCTION get_best_alternative_names(
    p_concept_id UUID,
    p_limit INTEGER DEFAULT 5
)
RETURNS TABLE(
    name VARCHAR(255),
    rationale TEXT,
    emphasis TEXT[],
    score DECIMAL(3,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (alt->>'name')::VARCHAR(255) AS name,
        alt->>'rationale' AS rationale,
        ARRAY(SELECT jsonb_array_elements_text(alt->'emphasis')) AS emphasis,
        COALESCE((alt->>'score')::DECIMAL(3,2), 0.5) AS score
    FROM concept_names cn,
         jsonb_array_elements(cn.alternative_names) AS alt
    WHERE 
        cn.concept_id = p_concept_id AND
        cn.is_current = TRUE
    ORDER BY COALESCE((alt->>'score')::DECIMAL(3,2), 0.5) DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Add comments
COMMENT ON TABLE concept_names IS 'Stores concept name analyses and alternative naming suggestions';
COMMENT ON COLUMN concept_names.name_id IS 'Unique identifier for the name analysis';
COMMENT ON COLUMN concept_names.concept_id IS 'Reference to the concept being analyzed';
COMMENT ON COLUMN concept_names.interaction_id IS 'Reference to the Claude interaction that generated this analysis';
COMMENT ON COLUMN concept_names.current_name IS 'The name being analyzed';
COMMENT ON COLUMN concept_names.analysis IS 'Detailed analysis of the name';
COMMENT ON COLUMN concept_names.name_accuracy_score IS 'How accurately the name represents the concept (0-1)';
COMMENT ON COLUMN concept_names.emphasizes_aspects IS 'Aspects of the concept emphasized by the name';
COMMENT ON COLUMN concept_names.obscures_aspects IS 'Aspects of the concept obscured by the name';
COMMENT ON COLUMN concept_names.alternative_names IS 'Array of alternative name suggestions';
COMMENT ON COLUMN concept_names.is_current IS 'Whether this is the most recent analysis';
COMMENT ON FUNCTION get_concept_name_history IS 'Get the history of name analyses for a concept';
COMMENT ON FUNCTION find_similar_concept_names IS 'Find concepts with similar names';
COMMENT ON VIEW concept_name_summary IS 'Summary view of current name analyses for all concepts';