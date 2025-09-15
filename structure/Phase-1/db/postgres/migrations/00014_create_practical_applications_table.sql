-- Migration: 00014_create_practical_applications_table
-- Created at: 2024-01-01
-- Description: Create table for tracking practical applications of philosophical concepts

-- Create enum for application domains
CREATE TYPE application_domain AS ENUM (
    'education',
    'ethics',
    'politics',
    'business',
    'psychology',
    'healthcare',
    'technology',
    'law',
    'environment',
    'social_work',
    'counseling',
    'leadership',
    'conflict_resolution',
    'personal_development',
    'community_building',
    'policy_making',
    'research_methodology',
    'art_culture',
    'other'
);

-- Create practical_applications table
CREATE TABLE IF NOT EXISTS practical_applications (
    -- Primary key
    application_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Foreign keys
    concept_id UUID NOT NULL REFERENCES concepts(concept_id) ON DELETE CASCADE,
    interaction_id UUID REFERENCES claude_interactions(interaction_id) ON DELETE SET NULL,
    
    -- Domains of application
    domains JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of {domain, relevance_score, description}
    primary_domain application_domain,
    
    -- Overall application analysis
    application_analysis TEXT NOT NULL,
    operationalization_potential DECIMAL(3,2) CHECK (operationalization_potential >= 0 AND operationalization_potential <= 1),
    
    -- Implementation methods
    implementation_methods JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of {method, description, examples, difficulty}
    
    -- Relevance mappings
    relevance_mappings JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of {domain, thesis_ids, category_ids, rationale}
    
    -- Practical frameworks
    frameworks_developed JSONB DEFAULT '[]'::jsonb, -- Array of {name, description, components, use_cases}
    existing_frameworks TEXT[], -- Existing frameworks that incorporate similar ideas
    
    -- Case studies and examples
    case_studies JSONB DEFAULT '[]'::jsonb, -- Array of {title, domain, description, outcomes, lessons}
    real_world_applications TEXT[], -- Known real-world applications
    
    -- Tools and techniques
    practical_tools JSONB DEFAULT '[]'::jsonb, -- Array of {tool_name, purpose, how_to_use, effectiveness}
    assessment_methods TEXT[], -- Methods to assess application effectiveness
    
    -- Challenges and limitations
    implementation_challenges TEXT[],
    ethical_considerations TEXT[],
    cultural_adaptations_needed TEXT[],
    resource_requirements TEXT[],
    
    -- Success metrics
    success_indicators JSONB DEFAULT '[]'::jsonb, -- Array of {indicator, measurement_method, target_value}
    measurability_score DECIMAL(3,2) CHECK (measurability_score >= 0 AND measurability_score <= 1),
    
    -- Stakeholder analysis
    target_audiences JSONB DEFAULT '[]'::jsonb, -- Array of {audience, needs, benefits, adaptation_required}
    stakeholder_benefits TEXT[],
    
    -- Integration potential
    integration_with_existing JSONB DEFAULT '[]'::jsonb, -- Array of {system, integration_points, synergies}
    scalability_assessment TEXT,
    sustainability_assessment TEXT,
    
    -- Impact assessment
    potential_impact_score DECIMAL(3,2) CHECK (potential_impact_score >= 0 AND potential_impact_score <= 1),
    societal_benefit_score DECIMAL(3,2) CHECK (societal_benefit_score >= 0 AND societal_benefit_score <= 1),
    individual_benefit_score DECIMAL(3,2) CHECK (individual_benefit_score >= 0 AND individual_benefit_score <= 1),
    
    -- Metadata
    is_current BOOLEAN DEFAULT TRUE,
    confidence_level DECIMAL(3,2) DEFAULT 0.75 CHECK (confidence_level >= 0 AND confidence_level <= 1),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT chk_domains_format CHECK (jsonb_typeof(domains) = 'array'),
    CONSTRAINT chk_implementation_methods_format CHECK (jsonb_typeof(implementation_methods) = 'array'),
    CONSTRAINT chk_relevance_mappings_format CHECK (jsonb_typeof(relevance_mappings) = 'array'),
    CONSTRAINT chk_frameworks_format CHECK (jsonb_typeof(frameworks_developed) = 'array'),
    CONSTRAINT chk_case_studies_format CHECK (jsonb_typeof(case_studies) = 'array'),
    CONSTRAINT chk_tools_format CHECK (jsonb_typeof(practical_tools) = 'array'),
    CONSTRAINT chk_success_indicators_format CHECK (jsonb_typeof(success_indicators) = 'array'),
    CONSTRAINT chk_audiences_format CHECK (jsonb_typeof(target_audiences) = 'array'),
    CONSTRAINT chk_integration_format CHECK (jsonb_typeof(integration_with_existing) = 'array')
);

-- Create indexes
CREATE INDEX idx_practical_applications_concept_id ON practical_applications(concept_id);
CREATE INDEX idx_practical_applications_interaction ON practical_applications(interaction_id) WHERE interaction_id IS NOT NULL;
CREATE INDEX idx_practical_applications_primary_domain ON practical_applications(primary_domain) WHERE primary_domain IS NOT NULL;
CREATE INDEX idx_practical_applications_is_current ON practical_applications(concept_id, is_current) WHERE is_current = TRUE;
CREATE INDEX idx_practical_applications_created_at ON practical_applications(created_at DESC);
CREATE INDEX idx_practical_applications_potential_impact ON practical_applications(potential_impact_score DESC);

-- Create GIN indexes for JSONB searches
CREATE INDEX idx_practical_applications_domains ON practical_applications USING GIN(domains);
CREATE INDEX idx_practical_applications_methods ON practical_applications USING GIN(implementation_methods);

-- Create trigger to update updated_at
CREATE TRIGGER update_practical_applications_updated_at 
    BEFORE UPDATE ON practical_applications
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create function to validate practical application data
CREATE OR REPLACE FUNCTION validate_practical_application_data()
RETURNS TRIGGER AS $$
DECLARE
    domain JSONB;
    method JSONB;
    mapping JSONB;
    framework JSONB;
    case_study JSONB;
    tool JSONB;
    indicator JSONB;
    audience JSONB;
BEGIN
    -- Validate domains
    FOR domain IN SELECT jsonb_array_elements(NEW.domains)
    LOOP
        IF NOT (domain ? 'domain' AND domain ? 'relevance_score') THEN
            RAISE EXCEPTION 'Each domain must have domain name and relevance_score';
        END IF;
        
        -- Check relevance score is valid
        IF (domain->>'relevance_score')::DECIMAL < 0 OR (domain->>'relevance_score')::DECIMAL > 1 THEN
            RAISE EXCEPTION 'Domain relevance_score must be between 0 and 1';
        END IF;
    END LOOP;
    
    -- Validate implementation methods
    FOR method IN SELECT jsonb_array_elements(NEW.implementation_methods)
    LOOP
        IF NOT (method ? 'method' AND method ? 'description') THEN
            RAISE EXCEPTION 'Each implementation method must have method and description';
        END IF;
    END LOOP;
    
    -- Validate relevance mappings
    FOR mapping IN SELECT jsonb_array_elements(NEW.relevance_mappings)
    LOOP
        IF NOT (mapping ? 'domain' AND mapping ? 'rationale') THEN
            RAISE EXCEPTION 'Each relevance mapping must have domain and rationale';
        END IF;
    END LOOP;
    
    -- Validate frameworks
    FOR framework IN SELECT jsonb_array_elements(NEW.frameworks_developed)
    LOOP
        IF NOT (framework ? 'name' AND framework ? 'description' AND framework ? 'components') THEN
            RAISE EXCEPTION 'Each framework must have name, description, and components';
        END IF;
    END LOOP;
    
    -- Validate case studies
    FOR case_study IN SELECT jsonb_array_elements(NEW.case_studies)
    LOOP
        IF NOT (case_study ? 'title' AND case_study ? 'domain' AND case_study ? 'description') THEN
            RAISE EXCEPTION 'Each case study must have title, domain, and description';
        END IF;
    END LOOP;
    
    -- Validate success indicators
    FOR indicator IN SELECT jsonb_array_elements(NEW.success_indicators)
    LOOP
        IF NOT (indicator ? 'indicator' AND indicator ? 'measurement_method') THEN
            RAISE EXCEPTION 'Each success indicator must have indicator and measurement_method';
        END IF;
    END LOOP;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to validate data
CREATE TRIGGER validate_practical_applications_data
    BEFORE INSERT OR UPDATE ON practical_applications
    FOR EACH ROW
    EXECUTE FUNCTION validate_practical_application_data();

-- Create function to archive old analyses
CREATE OR REPLACE FUNCTION archive_old_practical_applications()
RETURNS TRIGGER AS $$
BEGIN
    -- Set is_current to false for all other analyses of this concept
    UPDATE practical_applications
    SET is_current = FALSE
    WHERE concept_id = NEW.concept_id 
    AND application_id != NEW.application_id
    AND is_current = TRUE;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to manage current analysis
CREATE TRIGGER manage_current_practical_application
    AFTER INSERT ON practical_applications
    FOR EACH ROW
    WHEN (NEW.is_current = TRUE)
    EXECUTE FUNCTION archive_old_practical_applications();

-- Create function to find concepts applicable to domain
CREATE OR REPLACE FUNCTION find_concepts_by_domain(
    p_domain application_domain,
    p_min_relevance DECIMAL(3,2) DEFAULT 0.5
)
RETURNS TABLE(
    concept_id UUID,
    concept_name VARCHAR(255),
    relevance_score DECIMAL(3,2),
    implementation_count INTEGER,
    impact_score DECIMAL(3,2),
    has_case_studies BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    WITH domain_concepts AS (
        SELECT 
            pa.concept_id,
            c.name,
            (domain_obj->>'relevance_score')::DECIMAL(3,2) AS relevance,
            pa.potential_impact_score,
            jsonb_array_length(pa.implementation_methods) AS impl_count,
            jsonb_array_length(pa.case_studies) > 0 AS has_cases
        FROM practical_applications pa
        JOIN concepts c ON pa.concept_id = c.concept_id,
        jsonb_array_elements(pa.domains) AS domain_obj
        WHERE 
            pa.is_current = TRUE AND
            c.deleted_at IS NULL AND
            (domain_obj->>'domain')::application_domain = p_domain AND
            (domain_obj->>'relevance_score')::DECIMAL(3,2) >= p_min_relevance
    )
    SELECT 
        concept_id,
        name AS concept_name,
        relevance AS relevance_score,
        impl_count AS implementation_count,
        potential_impact_score AS impact_score,
        has_cases AS has_case_studies
    FROM domain_concepts
    ORDER BY relevance DESC, potential_impact_score DESC;
END;
$$ LANGUAGE plpgsql;

-- Create function to get implementation toolkit
CREATE OR REPLACE FUNCTION get_implementation_toolkit(
    p_concept_id UUID,
    p_domain application_domain DEFAULT NULL
)
RETURNS TABLE(
    tool_name TEXT,
    tool_purpose TEXT,
    how_to_use TEXT,
    effectiveness DECIMAL(3,2),
    applicable_domains application_domain[]
) AS $$
BEGIN
    RETURN QUERY
    WITH tools_data AS (
        SELECT 
            tool->>'tool_name' AS name,
            tool->>'purpose' AS purpose,
            tool->>'how_to_use' AS usage,
            COALESCE((tool->>'effectiveness')::DECIMAL(3,2), 0.7) AS effect,
            ARRAY(
                SELECT (d->>'domain')::application_domain
                FROM jsonb_array_elements(pa.domains) d
                WHERE (d->>'relevance_score')::DECIMAL > 0.3
            ) AS domains
        FROM practical_applications pa,
             jsonb_array_elements(pa.practical_tools) AS tool
        WHERE pa.concept_id = p_concept_id AND pa.is_current = TRUE
    )
    SELECT 
        name::TEXT AS tool_name,
        purpose::TEXT AS tool_purpose,
        usage::TEXT AS how_to_use,
        effect AS effectiveness,
        domains AS applicable_domains
    FROM tools_data
    WHERE p_domain IS NULL OR p_domain = ANY(domains)
    ORDER BY effect DESC;
END;
$$ LANGUAGE plpgsql;

-- Create view for domain application statistics
CREATE OR REPLACE VIEW domain_application_statistics AS
SELECT 
    d.domain_name::application_domain AS domain,
    COUNT(DISTINCT pa.concept_id) AS concept_count,
    AVG((d.domain_data->>'relevance_score')::DECIMAL) AS avg_relevance,
    AVG(pa.potential_impact_score) AS avg_impact,
    SUM(jsonb_array_length(pa.case_studies)) AS total_case_studies,
    SUM(jsonb_array_length(pa.practical_tools)) AS total_tools,
    COUNT(DISTINCT pa.concept_id) FILTER (
        WHERE jsonb_array_length(pa.frameworks_developed) > 0
    ) AS concepts_with_frameworks
FROM practical_applications pa,
     jsonb_array_elements(pa.domains) AS d(domain_data),
     jsonb_extract_path_text(d.domain_data, 'domain') AS d(domain_name)
WHERE pa.is_current = TRUE
GROUP BY d.domain_name
ORDER BY concept_count DESC;

-- Create function to suggest cross-domain applications
CREATE OR REPLACE FUNCTION suggest_cross_domain_applications(
    p_concept_id UUID,
    p_target_domain application_domain
)
RETURNS TABLE(
    suggestion TEXT,
    rationale TEXT,
    similarity_score DECIMAL(3,2),
    example_concepts UUID[]
) AS $$
BEGIN
    RETURN QUERY
    WITH concept_profile AS (
        SELECT 
            pa.implementation_methods,
            pa.practical_tools,
            array_agg(DISTINCT (d->>'domain')::application_domain) AS current_domains
        FROM practical_applications pa,
             jsonb_array_elements(pa.domains) d
        WHERE pa.concept_id = p_concept_id AND pa.is_current = TRUE
        GROUP BY pa.application_id, pa.implementation_methods, pa.practical_tools
        LIMIT 1
    ),
    similar_applications AS (
        SELECT 
            pa2.concept_id,
            pa2.implementation_methods,
            (d2->>'description') AS domain_desc
        FROM practical_applications pa2,
             jsonb_array_elements(pa2.domains) d2
        WHERE 
            pa2.is_current = TRUE AND
            pa2.concept_id != p_concept_id AND
            (d2->>'domain')::application_domain = p_target_domain
    )
    SELECT 
        'Apply concept using ' || (sa.implementation_methods->0->>'method')::TEXT AS suggestion,
        sa.domain_desc::TEXT AS rationale,
        0.75::DECIMAL(3,2) AS similarity_score, -- Simplified for example
        array_agg(sa.concept_id) AS example_concepts
    FROM similar_applications sa
    GROUP BY sa.implementation_methods->0->>'method', sa.domain_desc
    LIMIT 5;
END;
$$ LANGUAGE plpgsql;

-- Add comments
COMMENT ON TABLE practical_applications IS 'Analysis of practical applications for philosophical concepts';
COMMENT ON COLUMN practical_applications.application_id IS 'Unique identifier for the application analysis';
COMMENT ON COLUMN practical_applications.domains IS 'Array of application domains with relevance scores';
COMMENT ON COLUMN practical_applications.operationalization_potential IS 'Potential for making concept operational (0-1)';
COMMENT ON COLUMN practical_applications.implementation_methods IS 'Methods for implementing the concept practically';
COMMENT ON COLUMN practical_applications.relevance_mappings IS 'Mappings between concept elements and domains';
COMMENT ON COLUMN practical_applications.potential_impact_score IS 'Potential overall impact (0-1)';
COMMENT ON FUNCTION find_concepts_by_domain IS 'Find concepts applicable to a specific domain';
COMMENT ON FUNCTION get_implementation_toolkit IS 'Get practical tools for implementing a concept';
COMMENT ON VIEW domain_application_statistics IS 'Statistics about practical applications by domain';