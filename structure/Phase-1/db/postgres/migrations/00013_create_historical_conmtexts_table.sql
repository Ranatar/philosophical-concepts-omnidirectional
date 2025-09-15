-- Migration: 00013_create_historical_contexts_table
-- Created at: 2024-01-01
-- Description: Create table for historical contextualization of philosophical concepts

-- Create historical_contexts table
CREATE TABLE IF NOT EXISTS historical_contexts (
    -- Primary key
    context_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Foreign keys
    concept_id UUID NOT NULL REFERENCES concepts(concept_id) ON DELETE CASCADE,
    interaction_id UUID REFERENCES claude_interactions(interaction_id) ON DELETE SET NULL,
    
    -- Time period information
    time_period VARCHAR(255) NOT NULL, -- e.g., "Ancient Greece (5th century BCE)"
    start_year INTEGER, -- Negative for BCE
    end_year INTEGER,   -- Negative for BCE
    period_characteristics TEXT, -- Key features of the period
    
    -- Historical analysis
    historical_analysis TEXT NOT NULL, -- Main historical context analysis
    
    -- Intellectual context
    intellectual_climate TEXT, -- Description of intellectual environment
    dominant_paradigms TEXT[], -- Dominant ways of thinking
    key_debates TEXT[], -- Major philosophical debates of the time
    methodological_approaches TEXT[], -- Common philosophical methods
    
    -- Influences (structured data)
    influences JSONB DEFAULT '[]'::jsonb, -- Array of {type, name, description, significance}
    
    -- Contemporaries (structured data)
    contemporaries JSONB DEFAULT '[]'::jsonb, -- Array of {philosopher_id, name, relationship, interaction_type}
    
    -- Subsequent influence (structured data)
    subsequent_influence JSONB DEFAULT '[]'::jsonb, -- Array of {period, thinkers, movements, impact_description}
    
    -- Geographic and cultural context
    geographic_centers TEXT[], -- Key locations
    cultural_context TEXT, -- Broader cultural environment
    political_context TEXT, -- Political environment
    social_context TEXT, -- Social conditions
    
    -- Related events and developments
    key_events JSONB DEFAULT '[]'::jsonb, -- Array of {year, event, relevance}
    scientific_developments TEXT[], -- Relevant scientific discoveries
    artistic_movements TEXT[], -- Related artistic movements
    
    -- Cross-cultural connections
    cross_cultural_exchanges TEXT[], -- Exchanges with other cultures
    translation_movements TEXT[], -- Translation activities
    
    -- Legacy and reception
    immediate_reception TEXT, -- How concept was received initially
    later_interpretations TEXT[], -- Major reinterpretations over time
    modern_relevance TEXT, -- Relevance to modern philosophy
    
    -- Influence metrics
    influence_score DECIMAL(3,2) CHECK (influence_score >= 0 AND influence_score <= 1),
    originality_in_context DECIMAL(3,2) CHECK (originality_in_context >= 0 AND originality_in_context <= 1),
    paradigm_shift_indicator BOOLEAN DEFAULT FALSE,
    
    -- Sources and references
    primary_sources TEXT[], -- Primary historical sources
    scholarly_references TEXT[], -- Modern scholarly works referenced
    
    -- Metadata
    is_current BOOLEAN DEFAULT TRUE,
    confidence_level DECIMAL(3,2) DEFAULT 0.75 CHECK (confidence_level >= 0 AND confidence_level <= 1),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT chk_year_order CHECK (
        (start_year IS NULL OR end_year IS NULL) OR 
        (end_year >= start_year)
    ),
    CONSTRAINT chk_influences_format CHECK (jsonb_typeof(influences) = 'array'),
    CONSTRAINT chk_contemporaries_format CHECK (jsonb_typeof(contemporaries) = 'array'),
    CONSTRAINT chk_subsequent_format CHECK (jsonb_typeof(subsequent_influence) = 'array'),
    CONSTRAINT chk_events_format CHECK (jsonb_typeof(key_events) = 'array')
);

-- Create indexes
CREATE INDEX idx_historical_contexts_concept_id ON historical_contexts(concept_id);
CREATE INDEX idx_historical_contexts_interaction ON historical_contexts(interaction_id) WHERE interaction_id IS NOT NULL;
CREATE INDEX idx_historical_contexts_period ON historical_contexts(start_year, end_year);
CREATE INDEX idx_historical_contexts_is_current ON historical_contexts(concept_id, is_current) WHERE is_current = TRUE;
CREATE INDEX idx_historical_contexts_created_at ON historical_contexts(created_at DESC);
CREATE INDEX idx_historical_contexts_paradigm_shift ON historical_contexts(paradigm_shift_indicator) WHERE paradigm_shift_indicator = TRUE;

-- Create GIN indexes for JSONB searches
CREATE INDEX idx_historical_contexts_influences ON historical_contexts USING GIN(influences);
CREATE INDEX idx_historical_contexts_contemporaries ON historical_contexts USING GIN(contemporaries);

-- Create trigger to update updated_at
CREATE TRIGGER update_historical_contexts_updated_at 
    BEFORE UPDATE ON historical_contexts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create function to validate influences structure
CREATE OR REPLACE FUNCTION validate_historical_influences()
RETURNS TRIGGER AS $$
DECLARE
    influence JSONB;
    contemporary JSONB;
    subsequent JSONB;
    event JSONB;
BEGIN
    -- Validate influences array
    FOR influence IN SELECT jsonb_array_elements(NEW.influences)
    LOOP
        IF NOT (influence ? 'type' AND influence ? 'name' AND influence ? 'description') THEN
            RAISE EXCEPTION 'Each influence must have type, name, and description';
        END IF;
        
        -- Validate influence type
        IF NOT (influence->>'type' IN ('philosophical', 'scientific', 'religious', 'political', 'cultural', 'personal')) THEN
            RAISE EXCEPTION 'Invalid influence type: %', influence->>'type';
        END IF;
    END LOOP;
    
    -- Validate contemporaries array
    FOR contemporary IN SELECT jsonb_array_elements(NEW.contemporaries)
    LOOP
        IF NOT (contemporary ? 'name' AND contemporary ? 'relationship') THEN
            RAISE EXCEPTION 'Each contemporary must have name and relationship';
        END IF;
    END LOOP;
    
    -- Validate subsequent influence array
    FOR subsequent IN SELECT jsonb_array_elements(NEW.subsequent_influence)
    LOOP
        IF NOT (subsequent ? 'period' AND subsequent ? 'impact_description') THEN
            RAISE EXCEPTION 'Each subsequent influence must have period and impact_description';
        END IF;
    END LOOP;
    
    -- Validate key events array
    FOR event IN SELECT jsonb_array_elements(NEW.key_events)
    LOOP
        IF NOT (event ? 'year' AND event ? 'event' AND event ? 'relevance') THEN
            RAISE EXCEPTION 'Each key event must have year, event, and relevance';
        END IF;
        
        -- Validate year is numeric
        BEGIN
            PERFORM (event->>'year')::INTEGER;
        EXCEPTION WHEN OTHERS THEN
            RAISE EXCEPTION 'Event year must be a valid integer';
        END;
    END LOOP;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to validate structured data
CREATE TRIGGER validate_historical_contexts_data
    BEFORE INSERT OR UPDATE ON historical_contexts
    FOR EACH ROW
    EXECUTE FUNCTION validate_historical_influences();

-- Create function to archive old historical contexts
CREATE OR REPLACE FUNCTION archive_old_historical_contexts()
RETURNS TRIGGER AS $$
BEGIN
    -- Set is_current to false for all other contexts of this concept
    UPDATE historical_contexts
    SET is_current = FALSE
    WHERE concept_id = NEW.concept_id 
    AND context_id != NEW.context_id
    AND is_current = TRUE;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to manage current context
CREATE TRIGGER manage_current_historical_context
    AFTER INSERT ON historical_contexts
    FOR EACH ROW
    WHEN (NEW.is_current = TRUE)
    EXECUTE FUNCTION archive_old_historical_contexts();

-- Create function to find concepts from same period
CREATE OR REPLACE FUNCTION find_contemporary_concepts(
    p_concept_id UUID,
    p_year_tolerance INTEGER DEFAULT 50
)
RETURNS TABLE(
    concept_id UUID,
    concept_name VARCHAR(255),
    time_period VARCHAR(255),
    overlap_years INTEGER,
    shared_influences INTEGER,
    shared_contemporaries INTEGER
) AS $$
BEGIN
    RETURN QUERY
    WITH target_context AS (
        SELECT 
            hc.start_year,
            hc.end_year,
            hc.influences,
            hc.contemporaries
        FROM historical_contexts hc
        WHERE hc.concept_id = p_concept_id AND hc.is_current = TRUE
        LIMIT 1
    ),
    period_concepts AS (
        SELECT 
            c.concept_id,
            c.name,
            hc.time_period,
            hc.start_year,
            hc.end_year,
            hc.influences,
            hc.contemporaries,
            -- Calculate year overlap
            LEAST(hc.end_year, tc.end_year) - GREATEST(hc.start_year, tc.start_year) AS overlap
        FROM concepts c
        JOIN historical_contexts hc ON c.concept_id = hc.concept_id AND hc.is_current = TRUE
        CROSS JOIN target_context tc
        WHERE c.concept_id != p_concept_id
        AND c.deleted_at IS NULL
        -- Check for period overlap with tolerance
        AND (
            (hc.start_year BETWEEN tc.start_year - p_year_tolerance AND tc.end_year + p_year_tolerance) OR
            (hc.end_year BETWEEN tc.start_year - p_year_tolerance AND tc.end_year + p_year_tolerance) OR
            (tc.start_year BETWEEN hc.start_year AND hc.end_year)
        )
    )
    SELECT 
        pc.concept_id,
        pc.name AS concept_name,
        pc.time_period,
        pc.overlap AS overlap_years,
        -- Count shared influences
        (
            SELECT COUNT(*)
            FROM jsonb_array_elements(pc.influences) i1
            JOIN jsonb_array_elements(tc.influences) i2 
            ON i1->>'name' = i2->>'name'
        ) AS shared_influences,
        -- Count shared contemporaries
        (
            SELECT COUNT(*)
            FROM jsonb_array_elements(pc.contemporaries) c1
            JOIN jsonb_array_elements(tc.contemporaries) c2 
            ON c1->>'name' = c2->>'name'
        ) AS shared_contemporaries
    FROM period_concepts pc
    CROSS JOIN target_context tc
    ORDER BY overlap_years DESC, shared_influences DESC, shared_contemporaries DESC;
END;
$$ LANGUAGE plpgsql;

-- Create function to trace influence through time
CREATE OR REPLACE FUNCTION trace_concept_influence(
    p_concept_id UUID
)
RETURNS TABLE(
    period VARCHAR(255),
    period_order INTEGER,
    influenced_thinkers TEXT[],
    influenced_movements TEXT[],
    impact_description TEXT,
    cumulative_influence_score DECIMAL(3,2)
) AS $$
BEGIN
    RETURN QUERY
    WITH influence_data AS (
        SELECT 
            influence->>'period' AS period,
            -- Extract period order based on common patterns
            CASE 
                WHEN influence->>'period' ILIKE '%ancient%' THEN 1
                WHEN influence->>'period' ILIKE '%medieval%' THEN 2
                WHEN influence->>'period' ILIKE '%renaissance%' THEN 3
                WHEN influence->>'period' ILIKE '%early modern%' THEN 4
                WHEN influence->>'period' ILIKE '%enlightenment%' THEN 5
                WHEN influence->>'period' ILIKE '%19th%' THEN 6
                WHEN influence->>'period' ILIKE '%20th%' THEN 7
                WHEN influence->>'period' ILIKE '%contemporary%' THEN 8
                ELSE 9
            END AS period_order,
            ARRAY(SELECT jsonb_array_elements_text(influence->'thinkers')) AS thinkers,
            ARRAY(SELECT jsonb_array_elements_text(influence->'movements')) AS movements,
            influence->>'impact_description' AS impact_desc,
            hc.influence_score
        FROM historical_contexts hc,
             jsonb_array_elements(hc.subsequent_influence) AS influence
        WHERE hc.concept_id = p_concept_id AND hc.is_current = TRUE
    )
    SELECT 
        period,
        period_order,
        thinkers AS influenced_thinkers,
        movements AS influenced_movements,
        impact_desc AS impact_description,
        SUM(influence_score) OVER (ORDER BY period_order) AS cumulative_influence_score
    FROM influence_data
    ORDER BY period_order;
END;
$$ LANGUAGE plpgsql;

-- Create view for historical period summary
CREATE OR REPLACE VIEW historical_period_summary AS
SELECT 
    CASE 
        WHEN start_year < -500 THEN 'Ancient (before 500 BCE)'
        WHEN start_year BETWEEN -500 AND 500 THEN 'Classical Antiquity (500 BCE - 500 CE)'
        WHEN start_year BETWEEN 501 AND 1000 THEN 'Medieval (501-1000)'
        WHEN start_year BETWEEN 1001 AND 1400 THEN 'High Medieval (1001-1400)'
        WHEN start_year BETWEEN 1401 AND 1600 THEN 'Renaissance (1401-1600)'
        WHEN start_year BETWEEN 1601 AND 1750 THEN 'Early Modern (1601-1750)'
        WHEN start_year BETWEEN 1751 AND 1900 THEN 'Modern (1751-1900)'
        WHEN start_year BETWEEN 1901 AND 2000 THEN '20th Century'
        ELSE 'Contemporary (21st Century)'
    END AS period_category,
    COUNT(DISTINCT concept_id) AS concept_count,
    AVG(influence_score) AS avg_influence_score,
    COUNT(*) FILTER (WHERE paradigm_shift_indicator = TRUE) AS paradigm_shifts,
    array_agg(DISTINCT geographic_centers) AS geographic_centers
FROM historical_contexts
WHERE is_current = TRUE
GROUP BY period_category;

-- Add comments
COMMENT ON TABLE historical_contexts IS 'Historical contextualization of philosophical concepts';
COMMENT ON COLUMN historical_contexts.context_id IS 'Unique identifier for the historical context';
COMMENT ON COLUMN historical_contexts.time_period IS 'Descriptive name of the historical period';
COMMENT ON COLUMN historical_contexts.influences IS 'Array of influences on the concept';
COMMENT ON COLUMN historical_contexts.contemporaries IS 'Array of contemporary thinkers';
COMMENT ON COLUMN historical_contexts.subsequent_influence IS 'Array of later influences of the concept';
COMMENT ON COLUMN historical_contexts.paradigm_shift_indicator IS 'Whether concept represented a paradigm shift';
COMMENT ON FUNCTION find_contemporary_concepts IS 'Find concepts from the same historical period';
COMMENT ON FUNCTION trace_concept_influence IS 'Trace the influence of a concept through time';
COMMENT ON VIEW historical_period_summary IS 'Summary statistics by historical period';