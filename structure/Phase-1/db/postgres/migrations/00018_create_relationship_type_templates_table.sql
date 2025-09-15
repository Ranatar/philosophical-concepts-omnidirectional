-- Migration: 00018_create_relationship_type_templates_table
-- Created at: 2024-01-01
-- Description: Create table for relationship type templates used in graph validation

-- Create relationship_type_templates table
CREATE TABLE IF NOT EXISTS relationship_type_templates (
    -- Primary key
    template_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Relationship type information
    type_name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    philosophical_grounding TEXT, -- Philosophical justification for this relationship type
    
    -- Directionality
    default_direction VARCHAR(20) DEFAULT 'unidirectional' CHECK (default_direction IN (
        'unidirectional',   -- A → B only
        'bidirectional',    -- A ↔ B
        'reflexive'         -- A → A
    )),
    
    -- Semantic properties
    is_transitive BOOLEAN DEFAULT FALSE, -- If A→B and B→C then A→C
    is_symmetric BOOLEAN DEFAULT FALSE,  -- If A→B then B→A
    is_reflexive BOOLEAN DEFAULT FALSE,  -- A→A is valid
    is_antisymmetric BOOLEAN DEFAULT FALSE, -- If A→B and B→A then A=B
    
    -- Usage guidelines
    usage_guidelines TEXT,
    typical_usage_contexts TEXT[], -- Where this relationship is typically used
    example_usage TEXT,
    
    -- Valid category combinations
    valid_source_categories TEXT[], -- Category types that can be source
    valid_target_categories TEXT[], -- Category types that can be target
    forbidden_combinations JSONB DEFAULT '[]'::jsonb, -- Array of {source, target} combinations to forbid
    
    -- Related relationship types
    implies_relationships TEXT[], -- Other relationships implied by this one
    excludes_relationships TEXT[], -- Relationships that cannot coexist
    inverse_relationship VARCHAR(100), -- Name of inverse relationship if exists
    
    -- Philosophical associations
    associated_traditions TEXT[], -- Traditions where this relationship is prominent
    originated_from VARCHAR(255), -- Tradition or thinker who formalized it
    
    -- Default characteristics (for Neo4j)
    default_strength DECIMAL(3,2) DEFAULT 0.5 CHECK (default_strength >= 0 AND default_strength <= 1),
    default_certainty DECIMAL(3,2) DEFAULT 0.7 CHECK (default_certainty >= 0 AND default_certainty <= 1),
    default_innovation_degree INTEGER DEFAULT 1 CHECK (default_innovation_degree >= 1 AND default_innovation_degree <= 5),
    
    -- Logical properties
    logical_notation VARCHAR(50), -- Formal notation if applicable (e.g., "⊃", "↔")
    formal_definition TEXT, -- Formal logical definition if applicable
    
    -- Validation rules
    validation_rules JSONB DEFAULT '{}', -- Custom validation rules
    minimum_strength DECIMAL(3,2) DEFAULT 0.1, -- Minimum allowed strength
    
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
    previous_version UUID REFERENCES relationship_type_templates(template_id),
    change_notes TEXT,
    
    -- Constraints
    CONSTRAINT chk_forbidden_combinations CHECK (jsonb_typeof(forbidden_combinations) = 'array'),
    CONSTRAINT chk_validation_rules_rel CHECK (jsonb_typeof(validation_rules) = 'object'),
    CONSTRAINT chk_type_name_not_empty CHECK (trim(type_name) != ''),
    CONSTRAINT chk_logical_consistency CHECK (
        -- Symmetric implies bidirectional
        (NOT is_symmetric OR default_direction = 'bidirectional') AND
        -- Antisymmetric excludes symmetric
        NOT (is_symmetric AND is_antisymmetric)
    )
);

-- Create indexes
CREATE INDEX idx_relationship_type_templates_name ON relationship_type_templates(type_name) WHERE is_active = TRUE;
CREATE INDEX idx_relationship_type_templates_is_system ON relationship_type_templates(is_system) WHERE is_active = TRUE;
CREATE INDEX idx_relationship_type_templates_created_by ON relationship_type_templates(created_by) WHERE created_by IS NOT NULL;
CREATE INDEX idx_relationship_type_templates_usage_count ON relationship_type_templates(usage_count DESC) WHERE is_active = TRUE;
CREATE INDEX idx_relationship_type_templates_traditions ON relationship_type_templates USING GIN(associated_traditions) WHERE is_active = TRUE;
CREATE INDEX idx_relationship_type_templates_inverse ON relationship_type_templates(inverse_relationship) WHERE inverse_relationship IS NOT NULL AND is_active = TRUE;

-- Create trigger to update updated_at
CREATE TRIGGER update_relationship_type_templates_updated_at 
    BEFORE UPDATE ON relationship_type_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create function to increment usage count
CREATE OR REPLACE FUNCTION increment_relationship_type_usage(
    p_type_name VARCHAR(100)
)
RETURNS VOID AS $$
BEGIN
    UPDATE relationship_type_templates
    SET usage_count = usage_count + 1
    WHERE type_name = p_type_name AND is_active = TRUE;
END;
$$ LANGUAGE plpgsql;

-- Create function to validate relationship
CREATE OR REPLACE FUNCTION validate_relationship_against_template(
    p_type_name VARCHAR(100),
    p_source_category VARCHAR(255),
    p_target_category VARCHAR(255),
    p_relationship_properties JSONB
)
RETURNS TABLE(
    is_valid BOOLEAN,
    validation_errors TEXT[]
) AS $$
DECLARE
    v_template relationship_type_templates%ROWTYPE;
    v_errors TEXT[] := '{}';
    v_forbidden JSONB;
BEGIN
    -- Get template
    SELECT * INTO v_template
    FROM relationship_type_templates
    WHERE type_name = p_type_name AND is_active = TRUE;
    
    IF NOT FOUND THEN
        RETURN QUERY SELECT FALSE, ARRAY['No active template found for relationship type: ' || p_type_name];
        RETURN;
    END IF;
    
    -- Check valid source categories
    IF v_template.valid_source_categories IS NOT NULL AND 
       array_length(v_template.valid_source_categories, 1) > 0 AND
       NOT (p_source_category = ANY(v_template.valid_source_categories)) THEN
        v_errors := array_append(v_errors, 
            'Invalid source category. Expected one of: ' || array_to_string(v_template.valid_source_categories, ', '));
    END IF;
    
    -- Check valid target categories
    IF v_template.valid_target_categories IS NOT NULL AND 
       array_length(v_template.valid_target_categories, 1) > 0 AND
       NOT (p_target_category = ANY(v_template.valid_target_categories)) THEN
        v_errors := array_append(v_errors, 
            'Invalid target category. Expected one of: ' || array_to_string(v_template.valid_target_categories, ', '));
    END IF;
    
    -- Check forbidden combinations
    FOR v_forbidden IN SELECT jsonb_array_elements(v_template.forbidden_combinations)
    LOOP
        IF v_forbidden->>'source' = p_source_category AND 
           v_forbidden->>'target' = p_target_category THEN
            v_errors := array_append(v_errors, 
                'Forbidden combination: ' || p_source_category || ' → ' || p_target_category);
        END IF;
    END LOOP;
    
    -- Check reflexive constraint
    IF p_source_category = p_target_category AND NOT v_template.is_reflexive THEN
        v_errors := array_append(v_errors, 
            'Reflexive relationship not allowed for type: ' || p_type_name);
    END IF;
    
    -- Check strength constraints
    IF p_relationship_properties ? 'strength' THEN
        DECLARE
            v_strength DECIMAL(3,2);
        BEGIN
            v_strength := (p_relationship_properties->>'strength')::DECIMAL(3,2);
            IF v_strength < v_template.minimum_strength THEN
                v_errors := array_append(v_errors, 
                    'Strength below minimum. Required: ' || v_template.minimum_strength);
            END IF;
        EXCEPTION WHEN OTHERS THEN
            v_errors := array_append(v_errors, 'Invalid strength value');
        END;
    END IF;
    
    RETURN QUERY SELECT 
        array_length(v_errors, 1) IS NULL OR array_length(v_errors, 1) = 0,
        v_errors;
END;
$$ LANGUAGE plpgsql;

-- Create function to get compatible relationship types
CREATE OR REPLACE FUNCTION get_compatible_relationship_types(
    p_source_category VARCHAR(255),
    p_target_category VARCHAR(255)
)
RETURNS TABLE(
    type_name VARCHAR(100),
    description TEXT,
    default_direction VARCHAR(20),
    compatibility_score DECIMAL(3,2)
) AS $$
BEGIN
    RETURN QUERY
    WITH compatible_types AS (
        SELECT 
            rt.type_name,
            rt.description,
            rt.default_direction,
            CASE
                -- Perfect match
                WHEN p_source_category = ANY(rt.valid_source_categories) AND 
                     p_target_category = ANY(rt.valid_target_categories) THEN 1.0
                -- Source matches, target unrestricted
                WHEN p_source_category = ANY(rt.valid_source_categories) AND 
                     rt.valid_target_categories IS NULL THEN 0.8
                -- Target matches, source unrestricted
                WHEN p_target_category = ANY(rt.valid_target_categories) AND 
                     rt.valid_source_categories IS NULL THEN 0.8
                -- No restrictions
                WHEN rt.valid_source_categories IS NULL AND 
                     rt.valid_target_categories IS NULL THEN 0.6
                ELSE 0.0
            END AS score
        FROM relationship_type_templates rt
        WHERE rt.is_active = TRUE
        AND NOT EXISTS (
            -- Not in forbidden combinations
            SELECT 1
            FROM jsonb_array_elements(rt.forbidden_combinations) fc
            WHERE fc->>'source' = p_source_category 
            AND fc->>'target' = p_target_category
        )
        AND (
            -- Check reflexive constraint
            p_source_category != p_target_category OR rt.is_reflexive = TRUE
        )
    )
    SELECT 
        type_name,
        description,
        default_direction,
        score::DECIMAL(3,2) AS compatibility_score
    FROM compatible_types
    WHERE score > 0
    ORDER BY score DESC, usage_count DESC, type_name;
END;
$$ LANGUAGE plpgsql;

-- Create function to check relationship implications
CREATE OR REPLACE FUNCTION get_implied_relationships(
    p_type_name VARCHAR(100)
)
RETURNS TABLE(
    implied_type VARCHAR(100),
    implication_strength VARCHAR(20), -- 'necessary', 'typical', 'possible'
    description TEXT
) AS $$
BEGIN
    RETURN QUERY
    -- Direct implications
    SELECT 
        unnest(rt.implies_relationships) AS implied_type,
        'necessary'::VARCHAR(20) AS implication_strength,
        rt2.description
    FROM relationship_type_templates rt
    LEFT JOIN relationship_type_templates rt2 
        ON rt2.type_name = ANY(rt.implies_relationships) AND rt2.is_active = TRUE
    WHERE rt.type_name = p_type_name AND rt.is_active = TRUE
    
    UNION
    
    -- Inverse relationships
    SELECT 
        rt.inverse_relationship AS implied_type,
        'typical'::VARCHAR(20) AS implication_strength,
        rt2.description
    FROM relationship_type_templates rt
    LEFT JOIN relationship_type_templates rt2 
        ON rt2.type_name = rt.inverse_relationship AND rt2.is_active = TRUE
    WHERE rt.type_name = p_type_name 
    AND rt.is_active = TRUE
    AND rt.inverse_relationship IS NOT NULL;
END;
$$ LANGUAGE plpgsql;

-- Create view for relationship type statistics
CREATE OR REPLACE VIEW relationship_type_statistics AS
SELECT 
    type_name,
    default_direction,
    usage_count,
    is_transitive,
    is_symmetric,
    is_reflexive,
    array_length(valid_source_categories, 1) AS source_restrictions_count,
    array_length(valid_target_categories, 1) AS target_restrictions_count,
    jsonb_array_length(forbidden_combinations) AS forbidden_combinations_count,
    is_system,
    created_at
FROM relationship_type_templates
WHERE is_active = TRUE
ORDER BY usage_count DESC, type_name;

-- Insert system-provided relationship type templates
INSERT INTO relationship_type_templates (
    type_name, description, philosophical_grounding, default_direction,
    is_transitive, is_symmetric, is_reflexive, is_antisymmetric,
    is_system, usage_guidelines, logical_notation
) VALUES
-- Hierarchical relationships
('hierarchical', 'Subordination or subsumption relation', 'One category is subordinate to or subsumed under another', 'unidirectional', 
    TRUE, FALSE, FALSE, TRUE, TRUE, 'Use for genus-species, whole-part, or general-specific relations', '⊂'),

('causal', 'Cause and effect relationship', 'One category is the cause or ground of another', 'unidirectional',
    TRUE, FALSE, FALSE, FALSE, TRUE, 'Use for causal connections and grounding relations', '→'),

('dialectical', 'Thesis-antithesis relationship', 'Categories stand in dialectical opposition or development', 'bidirectional',
    FALSE, TRUE, FALSE, FALSE, TRUE, 'Use for Hegelian dialectics and oppositional pairs', '↔'),

-- Logical relationships
('implication', 'Logical implication', 'One category logically implies another', 'unidirectional',
    TRUE, FALSE, TRUE, FALSE, TRUE, 'Use for logical entailment', '⊃'),

('contradiction', 'Logical contradiction', 'Categories are mutually exclusive', 'bidirectional',
    FALSE, TRUE, FALSE, FALSE, TRUE, 'Use for mutually exclusive categories', '⊥'),

('identity', 'Identity relation', 'Categories refer to the same concept', 'bidirectional',
    TRUE, TRUE, TRUE, TRUE, TRUE, 'Use sparingly for genuine identity', '≡'),

-- Phenomenological relationships
('intentional', 'Intentional relation', 'Consciousness directed toward object', 'unidirectional',
    FALSE, FALSE, FALSE, FALSE, TRUE, 'Use for phenomenological analysis', '→'),

('constitution', 'Constitutional relation', 'One phenomenon constitutes another', 'unidirectional',
    FALSE, FALSE, FALSE, FALSE, TRUE, 'Use for phenomenological constitution', '⇒'),

-- Metaphysical relationships
('grounding', 'Metaphysical grounding', 'One category grounds or founds another', 'unidirectional',
    TRUE, FALSE, FALSE, TRUE, TRUE, 'Use for metaphysical dependence', '≺'),

('emergence', 'Emergent property relation', 'Higher-level property emerges from lower', 'unidirectional',
    FALSE, FALSE, FALSE, FALSE, TRUE, 'Use for emergent phenomena', '↑'),

-- Temporal relationships
('temporal', 'Temporal succession', 'One category temporally follows another', 'unidirectional',
    TRUE, FALSE, FALSE, TRUE, TRUE, 'Use for temporal or historical sequences', '→ₜ'),

-- Semantic relationships
('analogy', 'Analogical relation', 'Categories share structural similarity', 'bidirectional',
    FALSE, TRUE, TRUE, FALSE, TRUE, 'Use for analogical reasoning', '≈'),

('complementary', 'Complementarity relation', 'Categories complete each other', 'bidirectional',
    FALSE, TRUE, FALSE, FALSE, TRUE, 'Use for complementary pairs', '⊕')

ON CONFLICT (type_name) DO NOTHING;

-- Create function to validate relationship consistency in graph
CREATE OR REPLACE FUNCTION validate_relationship_consistency(
    p_relationships JSONB -- Array of {type, source, target}
)
RETURNS TABLE(
    is_consistent BOOLEAN,
    inconsistencies TEXT[]
) AS $$
DECLARE
    v_rel JSONB;
    v_other_rel JSONB;
    v_template relationship_type_templates%ROWTYPE;
    v_errors TEXT[] := '{}';
BEGIN
    -- Check each relationship against others
    FOR v_rel IN SELECT jsonb_array_elements(p_relationships)
    LOOP
        -- Get template for this relationship
        SELECT * INTO v_template
        FROM relationship_type_templates
        WHERE type_name = v_rel->>'type' AND is_active = TRUE;
        
        IF FOUND THEN
            -- Check excluded relationships
            FOR v_other_rel IN SELECT jsonb_array_elements(p_relationships)
            LOOP
                IF v_rel != v_other_rel AND
                   v_rel->>'source' = v_other_rel->>'source' AND
                   v_rel->>'target' = v_other_rel->>'target' AND
                   (v_other_rel->>'type' = ANY(v_template.excludes_relationships)) THEN
                    v_errors := array_append(v_errors,
                        format('Relationship %s excludes %s between %s and %s',
                            v_rel->>'type', v_other_rel->>'type',
                            v_rel->>'source', v_rel->>'target'));
                END IF;
            END LOOP;
        END IF;
    END LOOP;
    
    RETURN QUERY SELECT 
        array_length(v_errors, 1) IS NULL OR array_length(v_errors, 1) = 0,
        v_errors;
END;
$$ LANGUAGE plpgsql;

-- Add comments
COMMENT ON TABLE relationship_type_templates IS 'Templates for relationship types used in concept graphs';
COMMENT ON COLUMN relationship_type_templates.template_id IS 'Unique identifier for the template';
COMMENT ON COLUMN relationship_type_templates.type_name IS 'Name of the relationship type';
COMMENT ON COLUMN relationship_type_templates.is_transitive IS 'Whether relationship is transitive (A→B ∧ B→C ⇒ A→C)';
COMMENT ON COLUMN relationship_type_templates.is_symmetric IS 'Whether relationship is symmetric (A→B ⇒ B→A)';
COMMENT ON COLUMN relationship_type_templates.is_reflexive IS 'Whether relationship can be reflexive (A→A)';
COMMENT ON COLUMN relationship_type_templates.valid_source_categories IS 'Category types that can be source of this relationship';
COMMENT ON COLUMN relationship_type_templates.forbidden_combinations IS 'Specific category combinations that are forbidden';
COMMENT ON FUNCTION validate_relationship_against_template IS 'Validate a relationship instance against its template';
COMMENT ON FUNCTION get_compatible_relationship_types IS 'Get relationship types compatible with given categories';
COMMENT ON VIEW relationship_type_statistics IS 'Statistics about relationship type usage';