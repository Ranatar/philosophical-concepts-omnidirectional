-- Migration: 00003_create_philosophers_table
-- Created at: 2024-01-01
-- Description: Create philosophers table for storing philosopher information

-- Create philosophers table
CREATE TABLE IF NOT EXISTS philosophers (
    -- Primary key
    philosopher_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Basic information
    name VARCHAR(255) NOT NULL,
    alternative_names TEXT[], -- Array of alternative names, pseudonyms, etc.
    
    -- Biographical data
    birth_year INTEGER,
    death_year INTEGER,
    birth_place VARCHAR(255),
    death_place VARCHAR(255),
    nationality VARCHAR(100),
    
    -- Description and biography
    description TEXT,
    biography TEXT,
    key_ideas TEXT[],
    major_works TEXT[],
    
    -- Philosophical characteristics
    traditions JSONB DEFAULT '[]'::jsonb, -- Array of tradition IDs
    influenced_by TEXT[], -- Array of philosopher names
    influenced TEXT[], -- Array of philosopher names they influenced
    contemporary_of TEXT[], -- Array of contemporary philosophers
    
    -- External references
    wikipedia_url VARCHAR(500),
    sep_url VARCHAR(500), -- Stanford Encyclopedia of Philosophy
    iep_url VARCHAR(500), -- Internet Encyclopedia of Philosophy
    external_links JSONB DEFAULT '[]'::jsonb,
    
    -- Metadata
    image_url VARCHAR(500),
    is_verified BOOLEAN DEFAULT FALSE, -- Verified by admin/expert
    verification_notes TEXT,
    
    -- Usage statistics
    reference_count INTEGER DEFAULT 0, -- Times referenced in concepts
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    verified_at TIMESTAMP WITH TIME ZONE,
    
    -- Soft delete
    deleted_at TIMESTAMP WITH TIME ZONE,
    
    -- Constraints
    CONSTRAINT chk_birth_death_years CHECK (
        (birth_year IS NULL OR death_year IS NULL) OR 
        (death_year >= birth_year)
    ),
    CONSTRAINT chk_year_range CHECK (
        (birth_year IS NULL OR (birth_year >= -3000 AND birth_year <= 2100)) AND
        (death_year IS NULL OR (death_year >= -3000 AND death_year <= 2100))
    ),
    CONSTRAINT chk_name_not_empty CHECK (trim(name) != ''),
    CONSTRAINT chk_traditions_format CHECK (jsonb_typeof(traditions) = 'array'),
    CONSTRAINT chk_external_links_format CHECK (jsonb_typeof(external_links) = 'array')
);

-- Create indexes
CREATE INDEX idx_philosophers_name ON philosophers(name) WHERE deleted_at IS NULL;
CREATE INDEX idx_philosophers_birth_year ON philosophers(birth_year) WHERE deleted_at IS NULL;
CREATE INDEX idx_philosophers_death_year ON philosophers(death_year) WHERE deleted_at IS NULL;
CREATE INDEX idx_philosophers_nationality ON philosophers(nationality) WHERE deleted_at IS NULL;
CREATE INDEX idx_philosophers_is_verified ON philosophers(is_verified) WHERE deleted_at IS NULL;
CREATE INDEX idx_philosophers_traditions ON philosophers USING GIN(traditions) WHERE deleted_at IS NULL;
CREATE INDEX idx_philosophers_influenced_by ON philosophers USING GIN(influenced_by) WHERE deleted_at IS NULL;
CREATE INDEX idx_philosophers_influenced ON philosophers USING GIN(influenced) WHERE deleted_at IS NULL;

-- Create full-text search index
CREATE INDEX idx_philosophers_fulltext ON philosophers 
USING GIN(to_tsvector('english', 
    coalesce(name, '') || ' ' || 
    coalesce(description, '') || ' ' || 
    coalesce(array_to_string(key_ideas, ' '), '')
)) WHERE deleted_at IS NULL;

-- Create trigger to update updated_at
CREATE TRIGGER update_philosophers_updated_at 
    BEFORE UPDATE ON philosophers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create function to validate traditions structure
CREATE OR REPLACE FUNCTION validate_philosopher_traditions()
RETURNS TRIGGER AS $$
DECLARE
    tradition JSONB;
BEGIN
    -- Check that traditions is an array
    IF jsonb_typeof(NEW.traditions) != 'array' THEN
        RAISE EXCEPTION 'traditions must be an array';
    END IF;
    
    -- Validate each tradition in the array
    FOR tradition IN SELECT jsonb_array_elements(NEW.traditions)
    LOOP
        -- Each tradition should be a string (tradition ID)
        IF jsonb_typeof(tradition) != 'string' THEN
            RAISE EXCEPTION 'Each tradition must be a string ID';
        END IF;
    END LOOP;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to validate traditions
CREATE TRIGGER validate_philosophers_traditions
    BEFORE INSERT OR UPDATE ON philosophers
    FOR EACH ROW
    WHEN (NEW.traditions IS NOT NULL)
    EXECUTE FUNCTION validate_philosopher_traditions();

-- Create function to validate external links structure
CREATE OR REPLACE FUNCTION validate_philosopher_external_links()
RETURNS TRIGGER AS $$
DECLARE
    link JSONB;
BEGIN
    -- Check that external_links is an array
    IF jsonb_typeof(NEW.external_links) != 'array' THEN
        RAISE EXCEPTION 'external_links must be an array';
    END IF;
    
    -- Validate each link in the array
    FOR link IN SELECT jsonb_array_elements(NEW.external_links)
    LOOP
        -- Each link should be an object with title and url
        IF jsonb_typeof(link) != 'object' THEN
            RAISE EXCEPTION 'Each external link must be an object';
        END IF;
        
        IF NOT (link ? 'title' AND link ? 'url') THEN
            RAISE EXCEPTION 'Each external link must have title and url properties';
        END IF;
        
        IF jsonb_typeof(link->>'title') != 'string' OR jsonb_typeof(link->>'url') != 'string' THEN
            RAISE EXCEPTION 'Link title and url must be strings';
        END IF;
    END LOOP;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to validate external links
CREATE TRIGGER validate_philosophers_external_links
    BEFORE INSERT OR UPDATE ON philosophers
    FOR EACH ROW
    WHEN (NEW.external_links IS NOT NULL)
    EXECUTE FUNCTION validate_philosopher_external_links();

-- Create function to search philosophers
CREATE OR REPLACE FUNCTION search_philosophers(
    search_query TEXT,
    limit_count INTEGER DEFAULT 20,
    offset_count INTEGER DEFAULT 0
)
RETURNS TABLE(
    philosopher_id UUID,
    name VARCHAR(255),
    birth_year INTEGER,
    death_year INTEGER,
    description TEXT,
    rank REAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.philosopher_id,
        p.name,
        p.birth_year,
        p.death_year,
        p.description,
        ts_rank(
            to_tsvector('english', 
                coalesce(p.name, '') || ' ' || 
                coalesce(p.description, '') || ' ' || 
                coalesce(array_to_string(p.key_ideas, ' '), '')
            ),
            plainto_tsquery('english', search_query)
        ) AS rank
    FROM philosophers p
    WHERE 
        p.deleted_at IS NULL AND
        to_tsvector('english', 
            coalesce(p.name, '') || ' ' || 
            coalesce(p.description, '') || ' ' || 
            coalesce(array_to_string(p.key_ideas, ' '), '')
        ) @@ plainto_tsquery('english', search_query)
    ORDER BY rank DESC, p.name
    LIMIT limit_count
    OFFSET offset_count;
END;
$$ LANGUAGE plpgsql;

-- Add comments
COMMENT ON TABLE philosophers IS 'Table storing information about philosophers';
COMMENT ON COLUMN philosophers.philosopher_id IS 'Unique identifier for the philosopher';
COMMENT ON COLUMN philosophers.name IS 'Primary name of the philosopher';
COMMENT ON COLUMN philosophers.alternative_names IS 'Alternative names, pseudonyms, or name variations';
COMMENT ON COLUMN philosophers.birth_year IS 'Year of birth (negative for BCE)';
COMMENT ON COLUMN philosophers.death_year IS 'Year of death (negative for BCE)';
COMMENT ON COLUMN philosophers.traditions IS 'Array of philosophical tradition IDs';
COMMENT ON COLUMN philosophers.influenced_by IS 'Array of philosophers who influenced this philosopher';
COMMENT ON COLUMN philosophers.influenced IS 'Array of philosophers influenced by this philosopher';
COMMENT ON COLUMN philosophers.key_ideas IS 'Array of key philosophical ideas or concepts';
COMMENT ON COLUMN philosophers.major_works IS 'Array of major philosophical works';
COMMENT ON COLUMN philosophers.is_verified IS 'Whether the entry has been verified by an expert';
COMMENT ON COLUMN philosophers.reference_count IS 'Number of times referenced in concepts';
COMMENT ON FUNCTION search_philosophers IS 'Full-text search function for philosophers';