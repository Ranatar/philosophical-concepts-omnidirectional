-- Migration: 00006_create_concept_traditions_table
-- Created at: 2024-01-01
-- Description: Create junction table for many-to-many relationship between concepts and traditions

-- Create concept_traditions junction table
CREATE TABLE IF NOT EXISTS concept_traditions (
    -- Primary key
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Foreign keys
    concept_id UUID NOT NULL REFERENCES concepts(concept_id) ON DELETE CASCADE,
    tradition_id UUID NOT NULL REFERENCES traditions(tradition_id) ON DELETE CASCADE,
    
    -- Relationship strength and details
    relationship_strength DECIMAL(3,2) DEFAULT 0.50 CHECK (relationship_strength >= 0 AND relationship_strength <= 1),
    
    -- Relationship metadata
    relationship_type VARCHAR(50) DEFAULT 'belongs_to' CHECK (relationship_type IN (
        'belongs_to',      -- Concept belongs to this tradition
        'influenced_by',   -- Concept influenced by this tradition
        'synthesizes',     -- Concept synthesizes elements from this tradition
        'critiques',       -- Concept critiques this tradition
        'extends',         -- Concept extends this tradition
        'transforms',      -- Concept transforms this tradition
        'opposes',         -- Concept opposes this tradition
        'parallels'        -- Concept parallels this tradition
    )),
    
    -- Detailed relationship information
    influence_description TEXT,
    key_elements TEXT[], -- Key elements from tradition present in concept
    divergences TEXT[],  -- Ways concept diverges from tradition
    
    -- Historical context
    historical_period VARCHAR(255),
    is_primary_tradition BOOLEAN DEFAULT FALSE,
    
    -- Verification and quality
    is_verified BOOLEAN DEFAULT FALSE,
    verification_notes TEXT,
    confidence_level DECIMAL(3,2) DEFAULT 0.70 CHECK (confidence_level >= 0 AND confidence_level <= 1),
    
    -- Sources and references
    source_references TEXT[],
    scholarly_support TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    verified_at TIMESTAMP WITH TIME ZONE,
    
    -- Unique constraint to prevent duplicate relationships
    CONSTRAINT unique_concept_tradition_relationship UNIQUE (concept_id, tradition_id),
    
    -- Data quality constraints
    CONSTRAINT chk_relationship_strength CHECK (relationship_strength >= 0 AND relationship_strength <= 1),
    CONSTRAINT chk_confidence_level CHECK (confidence_level >= 0 AND confidence_level <= 1)
);

-- Create indexes for better query performance
CREATE INDEX idx_concept_traditions_concept_id ON concept_traditions(concept_id);
CREATE INDEX idx_concept_traditions_tradition_id ON concept_traditions(tradition_id);
CREATE INDEX idx_concept_traditions_relationship_type ON concept_traditions(relationship_type);
CREATE INDEX idx_concept_traditions_relationship_strength ON concept_traditions(relationship_strength DESC);
CREATE INDEX idx_concept_traditions_is_primary ON concept_traditions(is_primary_tradition) WHERE is_primary_tradition = TRUE;
CREATE INDEX idx_concept_traditions_is_verified ON concept_traditions(is_verified);
CREATE INDEX idx_concept_traditions_confidence ON concept_traditions(confidence_level DESC);

-- Create trigger to update updated_at
CREATE TRIGGER update_concept_traditions_updated_at 
    BEFORE UPDATE ON concept_traditions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create function to ensure at least one primary tradition per concept
CREATE OR REPLACE FUNCTION ensure_primary_tradition()
RETURNS TRIGGER AS $$
DECLARE
    primary_count INTEGER;
BEGIN
    -- Count existing primary traditions for this concept
    SELECT COUNT(*) INTO primary_count
    FROM concept_traditions
    WHERE concept_id = NEW.concept_id AND is_primary_tradition = TRUE AND id != NEW.id;
    
    -- If setting this as primary, optionally unset others (allow multiple primaries)
    -- Uncomment below to enforce single primary tradition
    /*
    IF NEW.is_primary_tradition = TRUE AND primary_count > 0 THEN
        UPDATE concept_traditions
        SET is_primary_tradition = FALSE
        WHERE concept_id = NEW.concept_id AND id != NEW.id AND is_primary_tradition = TRUE;
    END IF;
    */
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to manage primary traditions
CREATE TRIGGER manage_primary_traditions
    BEFORE INSERT OR UPDATE ON concept_traditions
    FOR EACH ROW
    WHEN (NEW.is_primary_tradition = TRUE)
    EXECUTE FUNCTION ensure_primary_tradition();

-- Create function to update tradition reference count
CREATE OR REPLACE FUNCTION update_tradition_reference_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE traditions 
        SET reference_count = reference_count + 1 
        WHERE tradition_id = NEW.tradition_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE traditions 
        SET reference_count = GREATEST(0, reference_count - 1)
        WHERE tradition_id = OLD.tradition_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update reference counts
CREATE TRIGGER update_tradition_references
    AFTER INSERT OR DELETE ON concept_traditions
    FOR EACH ROW
    EXECUTE FUNCTION update_tradition_reference_count();

-- Create function to calculate tradition compatibility
CREATE OR REPLACE FUNCTION calculate_tradition_compatibility(
    tradition_id_1 UUID,
    tradition_id_2 UUID
)
RETURNS DECIMAL(3,2) AS $$
DECLARE
    compatibility DECIMAL(3,2);
    shared_concepts INTEGER;
    total_concepts INTEGER;
BEGIN
    -- Count concepts that belong to both traditions
    SELECT COUNT(DISTINCT c1.concept_id) INTO shared_concepts
    FROM concept_traditions c1
    JOIN concept_traditions c2 ON c1.concept_id = c2.concept_id
    WHERE c1.tradition_id = tradition_id_1 
    AND c2.tradition_id = tradition_id_2
    AND c1.relationship_type IN ('belongs_to', 'extends')
    AND c2.relationship_type IN ('belongs_to', 'extends');
    
    -- Count total unique concepts in both traditions
    SELECT COUNT(DISTINCT concept_id) INTO total_concepts
    FROM concept_traditions
    WHERE tradition_id IN (tradition_id_1, tradition_id_2)
    AND relationship_type IN ('belongs_to', 'extends');
    
    -- Calculate compatibility as ratio
    IF total_concepts > 0 THEN
        compatibility := shared_concepts::DECIMAL / total_concepts;
    ELSE
        compatibility := 0;
    END IF;
    
    RETURN compatibility;
END;
$$ LANGUAGE plpgsql;

-- Create function to get traditions for a concept
CREATE OR REPLACE FUNCTION get_concept_traditions(
    p_concept_id UUID,
    p_min_strength DECIMAL(3,2) DEFAULT 0.0
)
RETURNS TABLE(
    tradition_id UUID,
    tradition_name VARCHAR(255),
    relationship_type VARCHAR(50),
    relationship_strength DECIMAL(3,2),
    influence_description TEXT,
    is_primary_tradition BOOLEAN,
    is_verified BOOLEAN,
    tradition_type VARCHAR(50),
    time_period VARCHAR(255)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.tradition_id,
        t.name AS tradition_name,
        ct.relationship_type,
        ct.relationship_strength,
        ct.influence_description,
        ct.is_primary_tradition,
        ct.is_verified,
        t.tradition_type,
        t.time_period
    FROM concept_traditions ct
    JOIN traditions t ON ct.tradition_id = t.tradition_id
    WHERE 
        ct.concept_id = p_concept_id AND
        ct.relationship_strength >= p_min_strength AND
        t.deleted_at IS NULL
    ORDER BY ct.is_primary_tradition DESC, ct.relationship_strength DESC, t.name;
END;
$$ LANGUAGE plpgsql;

-- Create function to get concepts by tradition
CREATE OR REPLACE FUNCTION get_tradition_concepts(
    p_tradition_id UUID,
    p_relationship_type VARCHAR(50) DEFAULT NULL,
    p_min_strength DECIMAL(3,2) DEFAULT 0.0
)
RETURNS TABLE(
    concept_id UUID,
    concept_name VARCHAR(255),
    relationship_type VARCHAR(50),
    relationship_strength DECIMAL(3,2),
    influence_description TEXT,
    is_primary_tradition BOOLEAN,
    concept_focus concept_focus_enum,
    concept_created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.concept_id,
        c.name AS concept_name,
        ct.relationship_type,
        ct.relationship_strength,
        ct.influence_description,
        ct.is_primary_tradition,
        c.focus AS concept_focus,
        c.creation_date AS concept_created_at
    FROM concept_traditions ct
    JOIN concepts c ON ct.concept_id = c.concept_id
    WHERE 
        ct.tradition_id = p_tradition_id AND
        (p_relationship_type IS NULL OR ct.relationship_type = p_relationship_type) AND
        ct.relationship_strength >= p_min_strength AND
        c.deleted_at IS NULL
    ORDER BY ct.is_primary_tradition DESC, ct.relationship_strength DESC, c.creation_date DESC;
END;
$$ LANGUAGE plpgsql;

-- Create view for tradition statistics
CREATE OR REPLACE VIEW tradition_concept_statistics AS
SELECT 
    t.tradition_id,
    t.name AS tradition_name,
    COUNT(DISTINCT ct.concept_id) AS total_concepts,
    COUNT(DISTINCT ct.concept_id) FILTER (WHERE ct.relationship_type = 'belongs_to') AS belonging_concepts,
    COUNT(DISTINCT ct.concept_id) FILTER (WHERE ct.relationship_type = 'influenced_by') AS influenced_concepts,
    COUNT(DISTINCT ct.concept_id) FILTER (WHERE ct.relationship_type = 'critiques') AS critiquing_concepts,
    AVG(ct.relationship_strength) AS avg_relationship_strength,
    COUNT(DISTINCT ct.concept_id) FILTER (WHERE ct.is_primary_tradition = TRUE) AS primary_tradition_count
FROM traditions t
LEFT JOIN concept_traditions ct ON t.tradition_id = ct.tradition_id
WHERE t.deleted_at IS NULL
GROUP BY t.tradition_id, t.name;

-- Add comments
COMMENT ON TABLE concept_traditions IS 'Junction table linking concepts to philosophical traditions';
COMMENT ON COLUMN concept_traditions.id IS 'Unique identifier for the relationship';
COMMENT ON COLUMN concept_traditions.concept_id IS 'Reference to the concept';
COMMENT ON COLUMN concept_traditions.tradition_id IS 'Reference to the tradition';
COMMENT ON COLUMN concept_traditions.relationship_strength IS 'Strength of relationship (0-1 scale)';
COMMENT ON COLUMN concept_traditions.relationship_type IS 'Type of relationship between concept and tradition';
COMMENT ON COLUMN concept_traditions.influence_description IS 'Description of how tradition influences concept';
COMMENT ON COLUMN concept_traditions.key_elements IS 'Key elements from tradition present in concept';
COMMENT ON COLUMN concept_traditions.divergences IS 'Ways the concept diverges from tradition';
COMMENT ON COLUMN concept_traditions.is_primary_tradition IS 'Whether this is a primary tradition for the concept';
COMMENT ON COLUMN concept_traditions.confidence_level IS 'Confidence in this relationship (0-1 scale)';
COMMENT ON FUNCTION calculate_tradition_compatibility IS 'Calculate compatibility between two traditions based on shared concepts';
COMMENT ON FUNCTION get_concept_traditions IS 'Get all traditions related to a specific concept';
COMMENT ON FUNCTION get_tradition_concepts IS 'Get all concepts related to a specific tradition';
COMMENT ON VIEW tradition_concept_statistics IS 'Statistical summary of tradition-concept relationships';