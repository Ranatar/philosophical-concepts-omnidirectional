-- Migration: 00004_create_traditions_table
-- Created at: 2024-01-01
-- Description: Create traditions table for philosophical traditions and schools

-- Create traditions table
CREATE TABLE IF NOT EXISTS traditions (
    -- Primary key
    tradition_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Basic information
    name VARCHAR(255) NOT NULL UNIQUE,
    alternative_names TEXT[], -- Array of alternative names
    
    -- Time period
    time_period VARCHAR(255),
    start_year INTEGER,
    end_year INTEGER,
    is_contemporary BOOLEAN DEFAULT FALSE,
    
    -- Geographic information
    origin_location VARCHAR(255),
    primary_regions TEXT[],
    
    -- Description
    description TEXT,
    key_principles TEXT[],
    methodology TEXT,
    main_questions TEXT[],
    
    -- Relationships
    parent_tradition UUID REFERENCES traditions(tradition_id) ON DELETE SET NULL,
    influenced_by TEXT[], -- Array of tradition names
    influenced TEXT[], -- Array of tradition names it influenced
    opposed_to TEXT[], -- Array of traditions it opposes
    
    -- Key figures
    key_figures JSONB DEFAULT '[]'::jsonb, -- Array of {philosopher_id, role, contribution}
    founder_ids UUID[], -- Array of philosopher IDs who founded the tradition
    
    -- Classification
    tradition_type VARCHAR(50) CHECK (tradition_type IN (
        'school', 'movement', 'method', 'approach', 'paradigm', 'tradition', 'current'
    )),
    philosophical_domain TEXT[] DEFAULT '{}', -- ontology, epistemology, ethics, etc.
    
    -- External references
    wikipedia_url VARCHAR(500),
    sep_url VARCHAR(500),
    iep_url VARCHAR(500),
    external_links JSONB DEFAULT '[]'::jsonb,
    
    -- Metadata
    is_verified BOOLEAN DEFAULT FALSE,
    verification_notes TEXT,
    importance_score INTEGER DEFAULT 5 CHECK (importance_score >= 1 AND importance_score <= 10),
    
    -- Usage statistics
    reference_count INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    verified_at TIMESTAMP WITH TIME ZONE,
    
    -- Soft delete
    deleted_at TIMESTAMP WITH TIME ZONE,
    
    -- Constraints
    CONSTRAINT chk_start_end_years CHECK (
        (start_year IS NULL OR end_year IS NULL) OR 
        (end_year >= start_year)
    ),
    CONSTRAINT chk_year_range_traditions CHECK (
        (start_year IS NULL OR (start_year >= -3000 AND start_year <= 2100)) AND
        (end_year IS NULL OR (end_year >= -3000 AND end_year <= 2100))
    ),
    CONSTRAINT chk_name_not_empty_traditions CHECK (trim(name) != ''),
    CONSTRAINT chk_key_figures_format CHECK (jsonb_typeof(key_figures) = 'array'),
    CONSTRAINT chk_external_links_format_traditions CHECK (jsonb_typeof(external_links) = 'array')
);

-- Create indexes
CREATE INDEX idx_traditions_name ON traditions(name) WHERE deleted_at IS NULL;
CREATE INDEX idx_traditions_parent_tradition ON traditions(parent_tradition) WHERE deleted_at IS NULL;
CREATE INDEX idx_traditions_start_year ON traditions(start_year) WHERE deleted_at IS NULL;
CREATE INDEX idx_traditions_end_year ON traditions(end_year) WHERE deleted_at IS NULL;
CREATE INDEX idx_traditions_is_contemporary ON traditions(is_contemporary) WHERE deleted_at IS NULL;
CREATE INDEX idx_traditions_tradition_type ON traditions(tradition_type) WHERE deleted_at IS NULL;
CREATE INDEX idx_traditions_is_verified ON traditions(is_verified) WHERE deleted_at IS NULL;
CREATE INDEX idx_traditions_importance_score ON traditions(importance_score) WHERE deleted_at IS NULL;
CREATE INDEX idx_traditions_philosophical_domain ON traditions USING GIN(philosophical_domain) WHERE deleted_at IS NULL;
CREATE INDEX idx_traditions_founder_ids ON traditions USING GIN(founder_ids) WHERE deleted_at IS NULL;

-- Create full-text search index
CREATE INDEX idx_traditions_fulltext ON traditions 
USING GIN(to_tsvector('english', 
    coalesce(name, '') || ' ' || 
    coalesce(description, '') || ' ' || 
    coalesce(array_to_string(key_principles, ' '), '') || ' ' ||
    coalesce(methodology, '')
)) WHERE deleted_at IS NULL;

-- Create trigger to update updated_at
CREATE TRIGGER update_traditions_updated_at 
    BEFORE UPDATE ON traditions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create function to validate key_figures structure
CREATE OR REPLACE FUNCTION validate_tradition_key_figures()
RETURNS TRIGGER AS $$
DECLARE
    figure JSONB;
BEGIN
    -- Check that key_figures is an array
    IF jsonb_typeof(NEW.key_figures) != 'array' THEN
        RAISE EXCEPTION 'key_figures must be an array';
    END IF;
    
    -- Validate each figure in the array
    FOR figure IN SELECT jsonb_array_elements(NEW.key_figures)
    LOOP
        -- Each figure should be an object
        IF jsonb_typeof(figure) != 'object' THEN
            RAISE EXCEPTION 'Each key figure must be an object';
        END IF;
        
        -- Required fields
        IF NOT (figure ? 'philosopher_id' AND figure ? 'role') THEN
            RAISE EXCEPTION 'Each key figure must have philosopher_id and role';
        END IF;
        
        -- Validate philosopher_id is a valid UUID
        BEGIN
            PERFORM (figure->>'philosopher_id')::UUID;
        EXCEPTION WHEN OTHERS THEN
            RAISE EXCEPTION 'Invalid philosopher_id in key_figures';
        END;
        
        -- Validate role is not empty
        IF trim(figure->>'role') = '' THEN
            RAISE EXCEPTION 'Role cannot be empty in key_figures';
        END IF;
    END LOOP;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to validate key figures
CREATE TRIGGER validate_traditions_key_figures
    BEFORE INSERT OR UPDATE ON traditions
    FOR EACH ROW
    WHEN (NEW.key_figures IS NOT NULL)
    EXECUTE FUNCTION validate_tradition_key_figures();

-- Create function to get tradition hierarchy
CREATE OR REPLACE FUNCTION get_tradition_hierarchy(root_tradition_id UUID)
RETURNS TABLE(
    tradition_id UUID,
    name VARCHAR(255),
    parent_tradition UUID,
    level INTEGER,
    path UUID[]
) AS $$
WITH RECURSIVE tradition_tree AS (
    -- Base case: root tradition
    SELECT 
        t.tradition_id,
        t.name,
        t.parent_tradition,
        0 AS level,
        ARRAY[t.tradition_id] AS path
    FROM traditions t
    WHERE t.tradition_id = root_tradition_id AND t.deleted_at IS NULL
    
    UNION ALL
    
    -- Recursive case: child traditions
    SELECT 
        t.tradition_id,
        t.name,
        t.parent_tradition,
        tt.level + 1,
        tt.path || t.tradition_id
    FROM traditions t
    INNER JOIN tradition_tree tt ON t.parent_tradition = tt.tradition_id
    WHERE t.deleted_at IS NULL AND NOT (t.tradition_id = ANY(tt.path)) -- Prevent cycles
)
SELECT * FROM tradition_tree
ORDER BY level, name;
$$ LANGUAGE sql;

-- Create function to search traditions
CREATE OR REPLACE FUNCTION search_traditions(
    search_query TEXT,
    domain_filter TEXT[] DEFAULT NULL,
    type_filter VARCHAR(50) DEFAULT NULL,
    limit_count INTEGER DEFAULT 20,
    offset_count INTEGER DEFAULT 0
)
RETURNS TABLE(
    tradition_id UUID,
    name VARCHAR(255),
    time_period VARCHAR(255),
    description TEXT,
    tradition_type VARCHAR(50),
    rank REAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.tradition_id,
        t.name,
        t.time_period,
        t.description,
        t.tradition_type,
        ts_rank(
            to_tsvector('english', 
                coalesce(t.name, '') || ' ' || 
                coalesce(t.description, '') || ' ' || 
                coalesce(array_to_string(t.key_principles, ' '), '') || ' ' ||
                coalesce(t.methodology, '')
            ),
            plainto_tsquery('english', search_query)
        ) AS rank
    FROM traditions t
    WHERE 
        t.deleted_at IS NULL AND
        to_tsvector('english', 
            coalesce(t.name, '') || ' ' || 
            coalesce(t.description, '') || ' ' || 
            coalesce(array_to_string(t.key_principles, ' '), '') || ' ' ||
            coalesce(t.methodology, '')
        ) @@ plainto_tsquery('english', search_query) AND
        (domain_filter IS NULL OR t.philosophical_domain && domain_filter) AND
        (type_filter IS NULL OR t.tradition_type = type_filter)
    ORDER BY rank DESC, t.importance_score DESC, t.name
    LIMIT limit_count
    OFFSET offset_count;
END;
$$ LANGUAGE plpgsql;

-- Add comments
COMMENT ON TABLE traditions IS 'Table storing philosophical traditions, schools, and movements';
COMMENT ON COLUMN traditions.tradition_id IS 'Unique identifier for the tradition';
COMMENT ON COLUMN traditions.name IS 'Primary name of the tradition';
COMMENT ON COLUMN traditions.time_period IS 'General time period description';
COMMENT ON COLUMN traditions.start_year IS 'Approximate start year (negative for BCE)';
COMMENT ON COLUMN traditions.end_year IS 'Approximate end year (negative for BCE)';
COMMENT ON COLUMN traditions.is_contemporary IS 'Whether the tradition is still active';
COMMENT ON COLUMN traditions.parent_tradition IS 'Parent tradition (for sub-schools)';
COMMENT ON COLUMN traditions.key_figures IS 'Array of key figures with their roles';
COMMENT ON COLUMN traditions.founder_ids IS 'Array of philosopher IDs who founded the tradition';
COMMENT ON COLUMN traditions.tradition_type IS 'Type of philosophical tradition';
COMMENT ON COLUMN traditions.philosophical_domain IS 'Domains of philosophy this tradition addresses';
COMMENT ON COLUMN traditions.importance_score IS 'Relative importance score (1-10)';
COMMENT ON FUNCTION get_tradition_hierarchy IS 'Get hierarchical tree of traditions';
COMMENT ON FUNCTION search_traditions IS 'Full-text search function for traditions with filters';