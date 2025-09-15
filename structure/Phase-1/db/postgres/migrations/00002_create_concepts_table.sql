-- Migration: 00002_create_concepts_table
-- Created at: 2024-01-01
-- Description: Create concepts table for philosophical concepts metadata

-- Create enum for innovation degree
CREATE TYPE innovation_degree_enum AS ENUM ('1', '2', '3', '4', '5');

-- Create enum for synthesis methods
CREATE TYPE synthesis_method_enum AS ENUM (
    'dialectical',
    'hermeneutical',
    'phenomenological',
    'analytical',
    'pragmatic',
    'deconstructive',
    'integrative',
    'comparative',
    'systemic',
    'genealogical'
);

-- Create enum for concept focus
CREATE TYPE concept_focus_enum AS ENUM (
    'ontological',
    'epistemological',
    'ethical',
    'aesthetic',
    'political',
    'metaphysical',
    'logical',
    'anthropological',
    'theological',
    'methodological'
);

-- Create concepts table
CREATE TABLE IF NOT EXISTS concepts (
    -- Primary key
    concept_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Foreign key to users
    creator_id UUID NOT NULL REFERENCES users(user_id) ON DELETE RESTRICT,
    
    -- Basic concept information
    name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Synthesis information
    is_synthesis BOOLEAN DEFAULT FALSE,
    parent_concepts JSONB DEFAULT '[]'::jsonb,
    synthesis_method synthesis_method_enum,
    synthesis_parameters JSONB DEFAULT '{}'::jsonb,
    
    -- Concept characteristics
    focus concept_focus_enum,
    innovation_degree innovation_degree_enum,
    historical_context VARCHAR(500),
    
    -- Metadata
    tags TEXT[] DEFAULT '{}',
    visibility VARCHAR(20) DEFAULT 'private' CHECK (visibility IN ('private', 'public', 'shared')),
    
    -- Statistics
    view_count INTEGER DEFAULT 0,
    edit_count INTEGER DEFAULT 0,
    synthesis_count INTEGER DEFAULT 0, -- How many times used in synthesis
    
    -- Timestamps
    creation_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_modified TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    published_at TIMESTAMP WITH TIME ZONE,
    
    -- Soft delete
    deleted_at TIMESTAMP WITH TIME ZONE,
    
    -- Constraints
    CONSTRAINT chk_synthesis_consistency CHECK (
        (is_synthesis = true AND synthesis_method IS NOT NULL AND array_length(parent_concepts::text[], 1) > 0) OR
        (is_synthesis = false)
    ),
    CONSTRAINT chk_parent_concepts_format CHECK (
        jsonb_typeof(parent_concepts) = 'array'
    ),
    CONSTRAINT chk_name_not_empty CHECK (trim(name) != '')
);

-- Create indexes
CREATE INDEX idx_concepts_creator_id ON concepts(creator_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_concepts_name ON concepts(name) WHERE deleted_at IS NULL;
CREATE INDEX idx_concepts_creation_date ON concepts(creation_date);
CREATE INDEX idx_concepts_last_modified ON concepts(last_modified);
CREATE INDEX idx_concepts_is_synthesis ON concepts(is_synthesis) WHERE deleted_at IS NULL;
CREATE INDEX idx_concepts_focus ON concepts(focus) WHERE deleted_at IS NULL;
CREATE INDEX idx_concepts_innovation_degree ON concepts(innovation_degree) WHERE deleted_at IS NULL;
CREATE INDEX idx_concepts_visibility ON concepts(visibility) WHERE deleted_at IS NULL;
CREATE INDEX idx_concepts_tags ON concepts USING GIN(tags) WHERE deleted_at IS NULL;
CREATE INDEX idx_concepts_parent_concepts ON concepts USING GIN(parent_concepts) WHERE is_synthesis = true AND deleted_at IS NULL;

-- Create trigger to update last_modified
CREATE TRIGGER update_concepts_last_modified 
    BEFORE UPDATE ON concepts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create function to validate parent_concepts structure
CREATE OR REPLACE FUNCTION validate_parent_concepts()
RETURNS TRIGGER AS $$
DECLARE
    parent_id TEXT;
    parent_uuid UUID;
BEGIN
    IF NEW.is_synthesis = true THEN
        -- Check that parent_concepts is an array
        IF jsonb_typeof(NEW.parent_concepts) != 'array' THEN
            RAISE EXCEPTION 'parent_concepts must be an array';
        END IF;
        
        -- Check that array is not empty
        IF jsonb_array_length(NEW.parent_concepts) = 0 THEN
            RAISE EXCEPTION 'parent_concepts cannot be empty for synthesis concepts';
        END IF;
        
        -- Validate each parent concept ID
        FOR parent_id IN SELECT jsonb_array_elements_text(NEW.parent_concepts)
        LOOP
            -- Try to cast to UUID
            BEGIN
                parent_uuid := parent_id::UUID;
            EXCEPTION WHEN OTHERS THEN
                RAISE EXCEPTION 'Invalid UUID in parent_concepts: %', parent_id;
            END;
            
            -- Check if parent concept exists
            IF NOT EXISTS (SELECT 1 FROM concepts WHERE concept_id = parent_uuid AND deleted_at IS NULL) THEN
                RAISE EXCEPTION 'Parent concept not found: %', parent_id;
            END IF;
        END LOOP;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to validate parent concepts
CREATE TRIGGER validate_concepts_parent_concepts
    BEFORE INSERT OR UPDATE ON concepts
    FOR EACH ROW
    WHEN (NEW.is_synthesis = true)
    EXECUTE FUNCTION validate_parent_concepts();

-- Create function to increment edit count
CREATE OR REPLACE FUNCTION increment_edit_count()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD IS NOT NULL AND NEW IS NOT NULL THEN
        -- Only increment if actual data changed (not just timestamps)
        IF OLD.name != NEW.name OR 
           OLD.description IS DISTINCT FROM NEW.description OR
           OLD.focus IS DISTINCT FROM NEW.focus OR
           OLD.innovation_degree IS DISTINCT FROM NEW.innovation_degree OR
           OLD.historical_context IS DISTINCT FROM NEW.historical_context OR
           OLD.tags IS DISTINCT FROM NEW.tags THEN
            NEW.edit_count = COALESCE(OLD.edit_count, 0) + 1;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to increment edit count
CREATE TRIGGER increment_concepts_edit_count
    BEFORE UPDATE ON concepts
    FOR EACH ROW
    EXECUTE FUNCTION increment_edit_count();

-- Create function to prevent deletion of concepts used in synthesis
CREATE OR REPLACE FUNCTION prevent_parent_concept_deletion()
RETURNS TRIGGER AS $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM concepts 
        WHERE is_synthesis = true 
        AND deleted_at IS NULL
        AND parent_concepts @> to_jsonb(OLD.concept_id::text)
    ) THEN
        RAISE EXCEPTION 'Cannot delete concept % - it is used as a parent in synthesis', OLD.concept_id;
    END IF;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to prevent deletion of parent concepts
CREATE TRIGGER prevent_concepts_parent_deletion
    BEFORE DELETE ON concepts
    FOR EACH ROW
    EXECUTE FUNCTION prevent_parent_concept_deletion();

-- Add comments
COMMENT ON TABLE concepts IS 'Main table storing philosophical concept metadata';
COMMENT ON COLUMN concepts.concept_id IS 'Unique identifier for the concept';
COMMENT ON COLUMN concepts.creator_id IS 'User who created the concept';
COMMENT ON COLUMN concepts.name IS 'Name of the philosophical concept';
COMMENT ON COLUMN concepts.description IS 'Detailed description of the concept';
COMMENT ON COLUMN concepts.is_synthesis IS 'Whether this concept is synthesized from others';
COMMENT ON COLUMN concepts.parent_concepts IS 'Array of parent concept IDs (for synthesis)';
COMMENT ON COLUMN concepts.synthesis_method IS 'Method used for synthesis';
COMMENT ON COLUMN concepts.synthesis_parameters IS 'Additional parameters used in synthesis';
COMMENT ON COLUMN concepts.focus IS 'Primary philosophical focus of the concept';
COMMENT ON COLUMN concepts.innovation_degree IS 'Degree of innovation (1-5 scale)';
COMMENT ON COLUMN concepts.historical_context IS 'Historical context or period';
COMMENT ON COLUMN concepts.tags IS 'Array of tags for categorization';
COMMENT ON COLUMN concepts.visibility IS 'Visibility level: private, public, or shared';
COMMENT ON COLUMN concepts.view_count IS 'Number of times the concept has been viewed';
COMMENT ON COLUMN concepts.edit_count IS 'Number of times the concept has been edited';
COMMENT ON COLUMN concepts.synthesis_count IS 'Number of times used as parent in synthesis';