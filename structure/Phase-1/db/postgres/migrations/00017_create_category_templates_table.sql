-- Migration: 00017_create_category_templates_table
-- Created at: 2024-01-01
-- Description: Create table for category templates used in graph validation

-- Create category_templates table
CREATE TABLE IF NOT EXISTS category_templates (
    -- Primary key
    template_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Category information
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    default_definition TEXT,
    
    -- Category type (same as in Neo4j)
    category_type VARCHAR(50) CHECK (category_type IN (
        'ontological',
        'epistemological',
        'axiological',
        'ethical',
        'aesthetic',
        'metaphysical',
        'logical',
        'practical',
        'political',
        'theological',
        'anthropological',
        'social',
        'linguistic',
        'phenomenological',
        'existential',
        'analytical',
        'hermeneutical',
        'cross_disciplinary'
    )),
    
    -- Usage guidelines
    usage_guidelines TEXT,
    typical_contexts TEXT[], -- Where this category is typically used
    example_usage TEXT,
    
    -- Relationships with other categories
    commonly_related_to TEXT[], -- Names of categories often related to this one
    incompatible_with TEXT[], -- Categories that shouldn't coexist
    implies_categories TEXT[], -- Categories that are implied by this one
    
    -- Philosophical traditions
    associated_traditions TEXT[], -- Traditions where this category is prominent
    originated_from VARCHAR(255), -- Tradition or thinker who originated it
    
    -- Validation rules
    requires_properties TEXT[], -- Properties that must be defined
    forbidden_properties TEXT[], -- Properties that shouldn't be used
    validation_rules JSONB DEFAULT '{}', -- Custom validation rules
    
    -- Default characteristics (for Neo4j)
    default_centrality DECIMAL(3,2) DEFAULT 0.5 CHECK (default_centrality >= 0 AND default_centrality <= 1),
    default_certainty DECIMAL(3,2) DEFAULT 0.7 CHECK (default_certainty >= 0 AND default_certainty <= 1),
    default_historical_significance DECIMAL(3,2) DEFAULT 0.5 CHECK (default_historical_significance >= 0 AND default_historical_significance <= 1),
    
    -- Metadata
    is_system BOOLEAN DEFAULT FALSE, -- System-provided vs user-created
    is_active BOOLEAN DEFAULT TRUE, -- Whether template is available for use
    usage_count INTEGER DEFAULT 0, -- How many times used
    
    -- Creator and timestamps
    created_by UUID REFERENCES users(user_id),
    approved_by UUID REFERENCES users(user_id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    approved_at TIMESTAMP WITH TIME ZONE,
    
    -- Version control
    version INTEGER DEFAULT 1,
    previous_version UUID REFERENCES category_templates(template_id),
    change_notes TEXT,
    
    -- Constraints
    CONSTRAINT chk_validation_rules CHECK (jsonb_typeof(validation_rules) = 'object'),
    CONSTRAINT chk_name_not_empty CHECK (trim(name) != '')
);

-- Create indexes
CREATE INDEX idx_category_templates_name ON category_templates(name) WHERE is_active = TRUE;
CREATE INDEX idx_category_templates_type ON category_templates(category_type) WHERE is_active = TRUE;
CREATE INDEX idx_category_templates_is_system ON category_templates(is_system) WHERE is_active = TRUE;
CREATE INDEX idx_category_templates_created_by ON category_templates(created_by) WHERE created_by IS NOT NULL;
CREATE INDEX idx_category_templates_usage_count ON category_templates(usage_count DESC) WHERE is_active = TRUE;
CREATE INDEX idx_category_templates_traditions ON category_templates USING GIN(associated_traditions) WHERE is_active = TRUE;

-- Create trigger to update updated_at
CREATE TRIGGER update_category_templates_updated_at 
    BEFORE UPDATE ON category_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create function to increment usage count
CREATE OR REPLACE FUNCTION increment_category_template_usage(
    p_template_name VARCHAR(255)
)
RETURNS VOID AS $$
BEGIN
    UPDATE category_templates
    SET usage_count = usage_count + 1
    WHERE name = p_template_name AND is_active = TRUE;
END;
$$ LANGUAGE plpgsql;

-- Create function to validate category against template
CREATE OR REPLACE FUNCTION validate_category_against_template(
    p_category_name VARCHAR(255),
    p_category_properties JSONB
)
RETURNS TABLE(
    is_valid BOOLEAN,
    validation_errors TEXT[]
) AS $$
DECLARE
    v_template category_templates%ROWTYPE;
    v_errors TEXT[] := '{}';
    v_required_prop TEXT;
    v_forbidden_prop TEXT;
BEGIN
    -- Get template
    SELECT * INTO v_template
    FROM category_templates
    WHERE name = p_category_name AND is_active = TRUE;
    
    IF NOT FOUND THEN
        RETURN QUERY SELECT FALSE, ARRAY['No active template found for category: ' || p_category_name];
        RETURN;
    END IF;
    
    -- Check required properties
    IF v_template.requires_properties IS NOT NULL THEN
        FOREACH v_required_prop IN ARRAY v_template.requires_properties
        LOOP
            IF NOT (p_category_properties ? v_required_prop) THEN
                v_errors := array_append(v_errors, 'Missing required property: ' || v_required_prop);
            END IF;
        END LOOP;
    END IF;
    
    -- Check forbidden properties
    IF v_template.forbidden_properties IS NOT NULL THEN
        FOREACH v_forbidden_prop IN ARRAY v_template.forbidden_properties
        LOOP
            IF p_category_properties ? v_forbidden_prop THEN
                v_errors := array_append(v_errors, 'Forbidden property present: ' || v_forbidden_prop);
            END IF;
        END LOOP;
    END IF;
    
    -- Apply custom validation rules if any
    -- This would be expanded based on specific validation rule structure
    
    RETURN QUERY SELECT 
        array_length(v_errors, 1) IS NULL OR array_length(v_errors, 1) = 0,
        v_errors;
END;
$$ LANGUAGE plpgsql;

-- Create function to suggest related categories
CREATE OR REPLACE FUNCTION suggest_related_categories(
    p_category_name VARCHAR(255),
    p_limit INTEGER DEFAULT 5
)
RETURNS TABLE(
    suggested_category VARCHAR(255),
    suggestion_reason TEXT,
    compatibility_score DECIMAL(3,2)
) AS $$
BEGIN
    RETURN QUERY
    WITH template_data AS (
        SELECT 
            commonly_related_to,
            category_type,
            associated_traditions
        FROM category_templates
        WHERE name = p_category_name AND is_active = TRUE
        LIMIT 1
    )
    -- Directly related categories
    SELECT 
        unnest(td.commonly_related_to) AS suggested_category,
        'Commonly related category' AS suggestion_reason,
        0.9::DECIMAL(3,2) AS compatibility_score
    FROM template_data td
    WHERE td.commonly_related_to IS NOT NULL
    
    UNION
    
    -- Categories from same type
    SELECT 
        ct.name AS suggested_category,
        'Same category type: ' || td.category_type AS suggestion_reason,
        0.7::DECIMAL(3,2) AS compatibility_score
    FROM template_data td
    JOIN category_templates ct ON ct.category_type = td.category_type
    WHERE ct.name != p_category_name 
    AND ct.is_active = TRUE
    AND NOT (ct.name = ANY(
        SELECT unnest(incompatible_with) 
        FROM category_templates 
        WHERE name = p_category_name
    ))
    
    UNION
    
    -- Categories from same tradition
    SELECT DISTINCT
        ct.name AS suggested_category,
        'Shared tradition: ' || tradition AS suggestion_reason,
        0.6::DECIMAL(3,2) AS compatibility_score
    FROM template_data td,
         unnest(td.associated_traditions) AS tradition
    JOIN category_templates ct ON tradition = ANY(ct.associated_traditions)
    WHERE ct.name != p_category_name 
    AND ct.is_active = TRUE
    
    ORDER BY compatibility_score DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Create function to create new version of template
CREATE OR REPLACE FUNCTION create_category_template_version(
    p_template_id UUID,
    p_changes JSONB,
    p_change_notes TEXT,
    p_user_id UUID
)
RETURNS UUID AS $$
DECLARE
    v_old_template category_templates%ROWTYPE;
    v_new_template_id UUID;
BEGIN
    -- Get current template
    SELECT * INTO v_old_template
    FROM category_templates
    WHERE template_id = p_template_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Template not found: %', p_template_id;
    END IF;
    
    -- Create new version
    INSERT INTO category_templates (
        name,
        description,
        default_definition,
        category_type,
        usage_guidelines,
        typical_contexts,
        example_usage,
        commonly_related_to,
        incompatible_with,
        implies_categories,
        associated_traditions,
        originated_from,
        requires_properties,
        forbidden_properties,
        validation_rules,
        default_centrality,
        default_certainty,
        default_historical_significance,
        is_system,
        is_active,
        created_by,
        version,
        previous_version,
        change_notes
    ) VALUES (
        COALESCE(p_changes->>'name', v_old_template.name),
        COALESCE(p_changes->>'description', v_old_template.description),
        COALESCE(p_changes->>'default_definition', v_old_template.default_definition),
        COALESCE((p_changes->>'category_type')::VARCHAR(50), v_old_template.category_type),
        COALESCE(p_changes->>'usage_guidelines', v_old_template.usage_guidelines),
        COALESCE(
            ARRAY(SELECT jsonb_array_elements_text(p_changes->'typical_contexts')),
            v_old_template.typical_contexts
        ),
        COALESCE(p_changes->>'example_usage', v_old_template.example_usage),
        COALESCE(
            ARRAY(SELECT jsonb_array_elements_text(p_changes->'commonly_related_to')),
            v_old_template.commonly_related_to
        ),
        COALESCE(
            ARRAY(SELECT jsonb_array_elements_text(p_changes->'incompatible_with')),
            v_old_template.incompatible_with
        ),
        COALESCE(
            ARRAY(SELECT jsonb_array_elements_text(p_changes->'implies_categories')),
            v_old_template.implies_categories
        ),
        COALESCE(
            ARRAY(SELECT jsonb_array_elements_text(p_changes->'associated_traditions')),
            v_old_template.associated_traditions
        ),
        COALESCE(p_changes->>'originated_from', v_old_template.originated_from),
        COALESCE(
            ARRAY(SELECT jsonb_array_elements_text(p_changes->'requires_properties')),
            v_old_template.requires_properties
        ),
        COALESCE(
            ARRAY(SELECT jsonb_array_elements_text(p_changes->'forbidden_properties')),
            v_old_template.forbidden_properties
        ),
        COALESCE(p_changes->'validation_rules', v_old_template.validation_rules),
        COALESCE((p_changes->>'default_centrality')::DECIMAL(3,2), v_old_template.default_centrality),
        COALESCE((p_changes->>'default_certainty')::DECIMAL(3,2), v_old_template.default_certainty),
        COALESCE((p_changes->>'default_historical_significance')::DECIMAL(3,2), v_old_template.default_historical_significance),
        v_old_template.is_system,
        FALSE, -- New version starts inactive
        p_user_id,
        v_old_template.version + 1,
        p_template_id,
        p_change_notes
    ) RETURNING template_id INTO v_new_template_id;
    
    RETURN v_new_template_id;
END;
$$ LANGUAGE plpgsql;

-- Create view for most used categories
CREATE OR REPLACE VIEW popular_category_templates AS
SELECT 
    name,
    category_type,
    usage_count,
    default_definition,
    array_length(commonly_related_to, 1) AS related_categories_count,
    is_system,
    created_at
FROM category_templates
WHERE is_active = TRUE
ORDER BY usage_count DESC, name;

-- Insert system-provided category templates
INSERT INTO category_templates (name, description, default_definition, category_type, is_system, usage_guidelines, typical_contexts, commonly_related_to) VALUES
-- Ontological categories
('Being', 'Fundamental category of existence', 'That which is; the most general category of existence', 'ontological', TRUE, 'Use for fundamental questions about what exists', ARRAY['metaphysics', 'fundamental ontology'], ARRAY['Becoming', 'Essence', 'Existence']),
('Becoming', 'Process of change and development', 'The process of coming to be or passing away', 'ontological', TRUE, 'Use for process philosophy and theories of change', ARRAY['process philosophy', 'dialectics'], ARRAY['Being', 'Time', 'Change']),
('Essence', 'The what-ness of things', 'The necessary properties that make something what it is', 'ontological', TRUE, 'Use for essential properties and definitions', ARRAY['metaphysics', 'scholasticism'], ARRAY['Existence', 'Substance', 'Form']),
('Existence', 'The that-ness of things', 'The fact or state of being', 'ontological', TRUE, 'Use for existential questions', ARRAY['existentialism', 'phenomenology'], ARRAY['Essence', 'Being', 'Nothingness']),

-- Epistemological categories
('Knowledge', 'Justified true belief or its alternatives', 'Awareness or understanding gained through experience or reasoning', 'epistemological', TRUE, 'Use for theories of knowledge', ARRAY['epistemology', 'philosophy of science'], ARRAY['Truth', 'Belief', 'Justification']),
('Truth', 'Correspondence with reality or coherence', 'The property of statements or beliefs that accord with reality', 'epistemological', TRUE, 'Use for theories of truth', ARRAY['logic', 'epistemology'], ARRAY['Knowledge', 'Reality', 'Falsehood']),
('Perception', 'Sensory awareness', 'The process of becoming aware through the senses', 'epistemological', TRUE, 'Use for philosophy of perception', ARRAY['empiricism', 'phenomenology'], ARRAY['Experience', 'Sensation', 'Consciousness']),

-- Ethical categories
('Good', 'Moral value or worth', 'That which is morally positive or desirable', 'ethical', TRUE, 'Use for value theory and ethics', ARRAY['ethics', 'axiology'], ARRAY['Evil', 'Right', 'Value']),
('Duty', 'Moral obligation', 'That which one is morally required to do', 'ethical', TRUE, 'Use for deontological ethics', ARRAY['deontology', 'Kantian ethics'], ARRAY['Obligation', 'Responsibility', 'Rights']),
('Virtue', 'Excellence of character', 'A trait or quality that is morally good', 'ethical', TRUE, 'Use for virtue ethics', ARRAY['virtue ethics', 'Aristotelian ethics'], ARRAY['Vice', 'Character', 'Excellence']),

-- Logical categories
('Identity', 'Sameness relation', 'The relation each thing has to itself and to no other', 'logical', TRUE, 'Use for identity and individuation', ARRAY['logic', 'metaphysics'], ARRAY['Difference', 'Unity', 'Plurality']),
('Causation', 'Relation of cause and effect', 'The relationship between causes and their effects', 'logical', TRUE, 'Use for causal theories', ARRAY['philosophy of science', 'metaphysics'], ARRAY['Effect', 'Necessity', 'Contingency']),
('Necessity', 'What must be the case', 'That which cannot be otherwise', 'logical', TRUE, 'Use for modal logic and metaphysics', ARRAY['modal logic', 'metaphysics'], ARRAY['Possibility', 'Contingency', 'Actuality'])

ON CONFLICT (name) DO NOTHING;

-- Add comments
COMMENT ON TABLE category_templates IS 'Templates for philosophical categories used in concept graphs';
COMMENT ON COLUMN category_templates.template_id IS 'Unique identifier for the template';
COMMENT ON COLUMN category_templates.name IS 'Name of the category (must be unique)';
COMMENT ON COLUMN category_templates.default_definition IS 'Default definition for the category';
COMMENT ON COLUMN category_templates.category_type IS 'Philosophical domain of the category';
COMMENT ON COLUMN category_templates.commonly_related_to IS 'Categories often related to this one';
COMMENT ON COLUMN category_templates.is_system IS 'Whether this is a system-provided template';
COMMENT ON COLUMN category_templates.usage_count IS 'Number of times this template has been used';
COMMENT ON FUNCTION validate_category_against_template IS 'Validate a category instance against its template';
COMMENT ON FUNCTION suggest_related_categories IS 'Suggest categories that work well with given category';
COMMENT ON VIEW popular_category_templates IS 'Most frequently used category templates';