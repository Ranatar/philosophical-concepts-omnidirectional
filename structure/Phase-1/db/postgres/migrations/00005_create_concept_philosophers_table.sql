-- Migration: 00005_create_concept_philosophers_table
-- Created at: 2024-01-01
-- Description: Create junction table for many-to-many relationship between concepts and philosophers

-- Create enum for relationship types
CREATE TYPE philosopher_relationship_type AS ENUM (
    'author',           -- Philosopher who authored/created the concept
    'contributor',      -- Philosopher who contributed to the concept
    'critic',          -- Philosopher who critiqued the concept
    'developer',       -- Philosopher who developed/expanded the concept
    'influenced_by',   -- Concept was influenced by this philosopher
    'interpreter',     -- Philosopher who interpreted the concept
    'popularizer',     -- Philosopher who popularized the concept
    'predecessor',     -- Philosopher whose work preceded the concept
    'contemporary',    -- Contemporary philosopher related to the concept
    'opponent'         -- Philosopher who opposed the concept
);

-- Create concept_philosophers junction table
CREATE TABLE IF NOT EXISTS concept_philosophers (
    -- Primary key
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Foreign keys
    concept_id UUID NOT NULL REFERENCES concepts(concept_id) ON DELETE CASCADE,
    philosopher_id UUID NOT NULL REFERENCES philosophers(philosopher_id) ON DELETE CASCADE,
    
    -- Relationship details
    relationship_type philosopher_relationship_type NOT NULL DEFAULT 'contributor',
    
    -- Additional relationship metadata
    contribution_description TEXT,
    significance_level INTEGER DEFAULT 5 CHECK (significance_level >= 1 AND significance_level <= 10),
    time_period VARCHAR(255), -- When this relationship was relevant
    
    -- Specific quotes or references
    key_quotes TEXT[],
    relevant_works TEXT[], -- Specific works where this relationship is evident
    
    -- Metadata
    notes TEXT,
    is_primary BOOLEAN DEFAULT FALSE, -- Is this a primary relationship for the concept
    is_verified BOOLEAN DEFAULT FALSE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    verified_at TIMESTAMP WITH TIME ZONE,
    
    -- Unique constraint to prevent duplicate relationships
    CONSTRAINT unique_concept_philosopher_relationship UNIQUE (concept_id, philosopher_id, relationship_type),
    
    -- Ensure at least one primary relationship per concept
    CONSTRAINT chk_significance_range CHECK (significance_level >= 1 AND significance_level <= 10)
);

-- Create indexes for better query performance
CREATE INDEX idx_concept_philosophers_concept_id ON concept_philosophers(concept_id);
CREATE INDEX idx_concept_philosophers_philosopher_id ON concept_philosophers(philosopher_id);
CREATE INDEX idx_concept_philosophers_relationship_type ON concept_philosophers(relationship_type);
CREATE INDEX idx_concept_philosophers_significance ON concept_philosophers(significance_level DESC);
CREATE INDEX idx_concept_philosophers_is_primary ON concept_philosophers(is_primary) WHERE is_primary = TRUE;
CREATE INDEX idx_concept_philosophers_is_verified ON concept_philosophers(is_verified);

-- Create trigger to update updated_at
CREATE TRIGGER update_concept_philosophers_updated_at 
    BEFORE UPDATE ON concept_philosophers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create function to ensure at least one primary philosopher per concept
CREATE OR REPLACE FUNCTION ensure_primary_philosopher()
RETURNS TRIGGER AS $$
DECLARE
    primary_count INTEGER;
BEGIN
    -- Count existing primary relationships for this concept
    SELECT COUNT(*) INTO primary_count
    FROM concept_philosophers
    WHERE concept_id = NEW.concept_id AND is_primary = TRUE AND id != NEW.id;
    
    -- If setting this as primary, unset others
    IF NEW.is_primary = TRUE AND primary_count > 0 THEN
        UPDATE concept_philosophers
        SET is_primary = FALSE
        WHERE concept_id = NEW.concept_id AND id != NEW.id AND is_primary = TRUE;
    END IF;
    
    -- If unsetting primary and no others exist, prevent it
    IF NEW.is_primary = FALSE AND primary_count = 0 AND OLD.is_primary = TRUE THEN
        -- Check if there are other philosophers for this concept
        IF EXISTS (SELECT 1 FROM concept_philosophers WHERE concept_id = NEW.concept_id AND id != NEW.id) THEN
            RAISE EXCEPTION 'Cannot remove primary status - at least one philosopher must be primary for the concept';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to manage primary philosophers
CREATE TRIGGER manage_primary_philosophers
    BEFORE UPDATE ON concept_philosophers
    FOR EACH ROW
    WHEN (NEW.is_primary IS DISTINCT FROM OLD.is_primary)
    EXECUTE FUNCTION ensure_primary_philosopher();

-- Create function to update philosopher reference count
CREATE OR REPLACE FUNCTION update_philosopher_reference_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE philosophers 
        SET reference_count = reference_count + 1 
        WHERE philosopher_id = NEW.philosopher_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE philosophers 
        SET reference_count = GREATEST(0, reference_count - 1)
        WHERE philosopher_id = OLD.philosopher_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update reference counts
CREATE TRIGGER update_philosopher_references
    AFTER INSERT OR DELETE ON concept_philosophers
    FOR EACH ROW
    EXECUTE FUNCTION update_philosopher_reference_count();

-- Create function to get philosophers for a concept
CREATE OR REPLACE FUNCTION get_concept_philosophers(
    p_concept_id UUID,
    p_relationship_type philosopher_relationship_type DEFAULT NULL
)
RETURNS TABLE(
    philosopher_id UUID,
    philosopher_name VARCHAR(255),
    relationship_type philosopher_relationship_type,
    contribution_description TEXT,
    significance_level INTEGER,
    is_primary BOOLEAN,
    birth_year INTEGER,
    death_year INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.philosopher_id,
        p.name AS philosopher_name,
        cp.relationship_type,
        cp.contribution_description,
        cp.significance_level,
        cp.is_primary,
        p.birth_year,
        p.death_year
    FROM concept_philosophers cp
    JOIN philosophers p ON cp.philosopher_id = p.philosopher_id
    WHERE 
        cp.concept_id = p_concept_id AND
        (p_relationship_type IS NULL OR cp.relationship_type = p_relationship_type) AND
        p.deleted_at IS NULL
    ORDER BY cp.is_primary DESC, cp.significance_level DESC, p.name;
END;
$$ LANGUAGE plpgsql;

-- Create function to get concepts by philosopher
CREATE OR REPLACE FUNCTION get_philosopher_concepts(
    p_philosopher_id UUID,
    p_relationship_type philosopher_relationship_type DEFAULT NULL
)
RETURNS TABLE(
    concept_id UUID,
    concept_name VARCHAR(255),
    relationship_type philosopher_relationship_type,
    contribution_description TEXT,
    significance_level INTEGER,
    is_primary BOOLEAN,
    concept_created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.concept_id,
        c.name AS concept_name,
        cp.relationship_type,
        cp.contribution_description,
        cp.significance_level,
        cp.is_primary,
        c.creation_date AS concept_created_at
    FROM concept_philosophers cp
    JOIN concepts c ON cp.concept_id = c.concept_id
    WHERE 
        cp.philosopher_id = p_philosopher_id AND
        (p_relationship_type IS NULL OR cp.relationship_type = p_relationship_type) AND
        c.deleted_at IS NULL
    ORDER BY cp.is_primary DESC, cp.significance_level DESC, c.creation_date DESC;
END;
$$ LANGUAGE plpgsql;

-- Add comments
COMMENT ON TABLE concept_philosophers IS 'Junction table linking concepts to philosophers with relationship details';
COMMENT ON COLUMN concept_philosophers.id IS 'Unique identifier for the relationship';
COMMENT ON COLUMN concept_philosophers.concept_id IS 'Reference to the concept';
COMMENT ON COLUMN concept_philosophers.philosopher_id IS 'Reference to the philosopher';
COMMENT ON COLUMN concept_philosophers.relationship_type IS 'Type of relationship between concept and philosopher';
COMMENT ON COLUMN concept_philosophers.contribution_description IS 'Description of the philosopher''s contribution to the concept';
COMMENT ON COLUMN concept_philosophers.significance_level IS 'Significance of the relationship (1-10 scale)';
COMMENT ON COLUMN concept_philosophers.time_period IS 'Time period when this relationship was relevant';
COMMENT ON COLUMN concept_philosophers.key_quotes IS 'Array of relevant quotes from the philosopher';
COMMENT ON COLUMN concept_philosophers.relevant_works IS 'Array of works where this relationship is evident';
COMMENT ON COLUMN concept_philosophers.is_primary IS 'Whether this is a primary philosopher for the concept';
COMMENT ON COLUMN concept_philosophers.is_verified IS 'Whether this relationship has been verified';
COMMENT ON FUNCTION get_concept_philosophers IS 'Get all philosophers related to a specific concept';
COMMENT ON FUNCTION get_philosopher_concepts IS 'Get all concepts related to a specific philosopher';