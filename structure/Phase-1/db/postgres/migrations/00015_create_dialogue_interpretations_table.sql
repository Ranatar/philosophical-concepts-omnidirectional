-- Migration: 00015_create_dialogue_interpretations_table
-- Created at: 2024-01-01
-- Description: Create table for storing philosophical dialogues between concepts

-- Create enum for dialogue types
CREATE TYPE dialogue_type AS ENUM (
    'debate',           -- Formal debate format
    'dialectical',      -- Dialectical exchange
    'socratic',         -- Socratic questioning
    'collaborative',    -- Collaborative exploration
    'critical',         -- Critical examination
    'comparative',      -- Comparative analysis
    'synthetic',        -- Synthesis-oriented
    'pedagogical',      -- Teaching dialogue
    'exploratory'       -- Open exploration
);

-- Create enum for participant roles
CREATE TYPE dialogue_role AS ENUM (
    'proponent',        -- Advocate for position
    'opponent',         -- Critic of position
    'questioner',       -- Socratic questioner
    'moderator',        -- Neutral moderator
    'synthesizer',      -- Seeks synthesis
    'devil_advocate',   -- Devil's advocate
    'student',          -- Learning role
    'teacher',          -- Teaching role
    'observer'          -- Commentary role
);

-- Create dialogue_interpretations table
CREATE TABLE IF NOT EXISTS dialogue_interpretations (
    -- Primary key
    dialogue_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Foreign keys
    interaction_id UUID REFERENCES claude_interactions(interaction_id) ON DELETE SET NULL,
    created_by UUID NOT NULL REFERENCES users(user_id),
    
    -- Dialogue setup
    philosophical_question TEXT NOT NULL,
    dialogue_type dialogue_type NOT NULL DEFAULT 'exploratory',
    dialogue_context TEXT, -- Context for the dialogue
    
    -- Dialogue content
    dialogue_content TEXT NOT NULL, -- Full dialogue text
    dialogue_structure JSONB DEFAULT '[]'::jsonb, -- Array of {speaker, role, position, text}
    
    -- Discussion points
    discussion_points JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of {point, introduced_by, responses}
    
    -- Arguments structure
    arguments JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of {position, premises, conclusion, strength}
    
    -- Key insights
    key_insights TEXT[], -- Main insights from dialogue
    unresolved_tensions TEXT[], -- Tensions that remain
    points_of_agreement TEXT[], -- Where participants agree
    points_of_disagreement TEXT[], -- Where they disagree
    
    -- Philosophical analysis
    dialectical_movements TEXT[], -- Key dialectical moves
    conceptual_clarifications JSONB DEFAULT '[]'::jsonb, -- Array of {term, clarification, importance}
    methodological_approaches TEXT[], -- Methods used in dialogue
    
    -- Logical analysis
    logical_structure JSONB DEFAULT '{}', -- Formal logical structure
    fallacies_identified TEXT[], -- Logical fallacies found
    validity_assessment TEXT, -- Assessment of argument validity
    
    -- Outcomes
    synthesis_achieved BOOLEAN DEFAULT FALSE,
    synthesis_description TEXT,
    new_questions_raised TEXT[], -- Questions emerging from dialogue
    research_directions TEXT[], -- Suggested further research
    
    -- Quality metrics
    philosophical_depth DECIMAL(3,2) CHECK (philosophical_depth >= 0 AND philosophical_depth <= 1),
    logical_rigor DECIMAL(3,2) CHECK (logical_rigor >= 0 AND logical_rigor <= 1),
    clarity_score DECIMAL(3,2) CHECK (clarity_score >= 0 AND clarity_score <= 1),
    productivity_score DECIMAL(3,2) CHECK (productivity_score >= 0 AND productivity_score <= 1),
    
    -- Educational value
    pedagogical_value DECIMAL(3,2) CHECK (pedagogical_value >= 0 AND pedagogical_value <= 1),
    target_audience TEXT[], -- Suitable audiences
    learning_objectives TEXT[], -- What can be learned
    
    -- Metadata
    word_count INTEGER,
    turn_count INTEGER, -- Number of dialogue turns
    estimated_duration INTEGER, -- Estimated reading time in minutes
    language VARCHAR(10) DEFAULT 'en',
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    published_at TIMESTAMP WITH TIME ZONE,
    
    -- Publishing
    is_published BOOLEAN DEFAULT FALSE,
    visibility VARCHAR(20) DEFAULT 'private' CHECK (visibility IN ('private', 'public', 'unlisted')),
    
    -- Constraints
    CONSTRAINT chk_dialogue_structure CHECK (jsonb_typeof(dialogue_structure) = 'array'),
    CONSTRAINT chk_discussion_points CHECK (jsonb_typeof(discussion_points) = 'array'),
    CONSTRAINT chk_arguments CHECK (jsonb_typeof(arguments) = 'array'),
    CONSTRAINT chk_clarifications CHECK (jsonb_typeof(conceptual_clarifications) = 'array'),
    CONSTRAINT chk_logical_structure CHECK (jsonb_typeof(logical_structure) = 'object')
);

-- Create indexes
CREATE INDEX idx_dialogue_interpretations_interaction ON dialogue_interpretations(interaction_id) WHERE interaction_id IS NOT NULL;
CREATE INDEX idx_dialogue_interpretations_created_by ON dialogue_interpretations(created_by);
CREATE INDEX idx_dialogue_interpretations_dialogue_type ON dialogue_interpretations(dialogue_type);
CREATE INDEX idx_dialogue_interpretations_created_at ON dialogue_interpretations(created_at DESC);
CREATE INDEX idx_dialogue_interpretations_published ON dialogue_interpretations(is_published, published_at DESC) WHERE is_published = TRUE;
CREATE INDEX idx_dialogue_interpretations_visibility ON dialogue_interpretations(visibility);
CREATE INDEX idx_dialogue_interpretations_synthesis ON dialogue_interpretations(synthesis_achieved) WHERE synthesis_achieved = TRUE;

-- Full-text search index
CREATE INDEX idx_dialogue_interpretations_fulltext ON dialogue_interpretations 
USING GIN(to_tsvector('english', 
    coalesce(philosophical_question, '') || ' ' || 
    coalesce(dialogue_content, '') || ' ' ||
    coalesce(array_to_string(key_insights, ' '), '')
));

-- Create trigger to update updated_at
CREATE TRIGGER update_dialogue_interpretations_updated_at 
    BEFORE UPDATE ON dialogue_interpretations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create function to validate dialogue structure
CREATE OR REPLACE FUNCTION validate_dialogue_structure()
RETURNS TRIGGER AS $$
DECLARE
    turn JSONB;
    point JSONB;
    argument JSONB;
    clarification JSONB;
BEGIN
    -- Validate dialogue structure
    FOR turn IN SELECT jsonb_array_elements(NEW.dialogue_structure)
    LOOP
        IF NOT (turn ? 'speaker' AND turn ? 'text') THEN
            RAISE EXCEPTION 'Each dialogue turn must have speaker and text';
        END IF;
        
        -- Validate role if present
        IF turn ? 'role' AND NOT (turn->>'role' IN (
            'proponent', 'opponent', 'questioner', 'moderator', 
            'synthesizer', 'devil_advocate', 'student', 'teacher', 'observer'
        )) THEN
            RAISE EXCEPTION 'Invalid dialogue role: %', turn->>'role';
        END IF;
    END LOOP;
    
    -- Validate discussion points
    FOR point IN SELECT jsonb_array_elements(NEW.discussion_points)
    LOOP
        IF NOT (point ? 'point' AND point ? 'introduced_by') THEN
            RAISE EXCEPTION 'Each discussion point must have point and introduced_by';
        END IF;
    END LOOP;
    
    -- Validate arguments
    FOR argument IN SELECT jsonb_array_elements(NEW.arguments)
    LOOP
        IF NOT (argument ? 'position' AND argument ? 'premises' AND argument ? 'conclusion') THEN
            RAISE EXCEPTION 'Each argument must have position, premises, and conclusion';
        END IF;
        
        -- Validate premises is array
        IF jsonb_typeof(argument->'premises') != 'array' THEN
            RAISE EXCEPTION 'Argument premises must be an array';
        END IF;
    END LOOP;
    
    -- Validate conceptual clarifications
    FOR clarification IN SELECT jsonb_array_elements(NEW.conceptual_clarifications)
    LOOP
        IF NOT (clarification ? 'term' AND clarification ? 'clarification') THEN
            RAISE EXCEPTION 'Each clarification must have term and clarification';
        END IF;
    END LOOP;
    
    -- Update counts
    NEW.word_count = array_length(string_to_array(NEW.dialogue_content, ' '), 1);
    NEW.turn_count = jsonb_array_length(NEW.dialogue_structure);
    NEW.estimated_duration = GREATEST(1, NEW.word_count / 200); -- Assuming 200 words per minute
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to validate structure
CREATE TRIGGER validate_dialogue_interpretations_structure
    BEFORE INSERT OR UPDATE ON dialogue_interpretations
    FOR EACH ROW
    EXECUTE FUNCTION validate_dialogue_structure();

-- Create function to extract argument map
CREATE OR REPLACE FUNCTION get_dialogue_argument_map(
    p_dialogue_id UUID
)
RETURNS TABLE(
    position TEXT,
    premise_count INTEGER,
    conclusion TEXT,
    strength DECIMAL(3,2),
    supporting_speakers TEXT[],
    opposing_speakers TEXT[]
) AS $$
BEGIN
    RETURN QUERY
    WITH argument_data AS (
        SELECT 
            arg->>'position' AS position,
            jsonb_array_length(arg->'premises') AS premises,
            arg->>'conclusion' AS conclusion,
            COALESCE((arg->>'strength')::DECIMAL(3,2), 0.5) AS strength
        FROM dialogue_interpretations di,
             jsonb_array_elements(di.arguments) AS arg
        WHERE di.dialogue_id = p_dialogue_id
    ),
    speaker_positions AS (
        SELECT 
            turn->>'speaker' AS speaker,
            turn->>'position' AS position
        FROM dialogue_interpretations di,
             jsonb_array_elements(di.dialogue_structure) AS turn
        WHERE di.dialogue_id = p_dialogue_id
        AND turn ? 'position'
    )
    SELECT 
        ad.position::TEXT,
        ad.premises AS premise_count,
        ad.conclusion::TEXT,
        ad.strength,
        array_agg(DISTINCT sp.speaker) FILTER (WHERE sp.position = ad.position) AS supporting_speakers,
        array_agg(DISTINCT sp.speaker) FILTER (WHERE sp.position != ad.position) AS opposing_speakers
    FROM argument_data ad
    LEFT JOIN speaker_positions sp ON TRUE
    GROUP BY ad.position, ad.premises, ad.conclusion, ad.strength;
END;
$$ LANGUAGE plpgsql;

-- Create function to find related dialogues
CREATE OR REPLACE FUNCTION find_related_dialogues(
    p_dialogue_id UUID,
    p_limit INTEGER DEFAULT 5
)
RETURNS TABLE(
    dialogue_id UUID,
    philosophical_question TEXT,
    dialogue_type dialogue_type,
    similarity_score DECIMAL(3,2),
    shared_concepts INTEGER
) AS $$
BEGIN
    RETURN QUERY
    WITH target_dialogue AS (
        SELECT 
            di.philosophical_question,
            di.dialogue_type,
            array_agg(DISTINCT dp.concept_id) AS concept_ids
        FROM dialogue_interpretations di
        LEFT JOIN dialogue_participants dp ON di.dialogue_id = dp.dialogue_id
        WHERE di.dialogue_id = p_dialogue_id
        GROUP BY di.dialogue_id, di.philosophical_question, di.dialogue_type
    ),
    dialogue_similarities AS (
        SELECT 
            di2.dialogue_id,
            di2.philosophical_question,
            di2.dialogue_type,
            COUNT(DISTINCT dp2.concept_id) FILTER (
                WHERE dp2.concept_id = ANY(td.concept_ids)
            ) AS shared_concepts,
            similarity(di2.philosophical_question, td.philosophical_question) AS text_similarity
        FROM dialogue_interpretations di2
        LEFT JOIN dialogue_participants dp2 ON di2.dialogue_id = dp2.dialogue_id
        CROSS JOIN target_dialogue td
        WHERE di2.dialogue_id != p_dialogue_id
        AND di2.is_published = TRUE
        GROUP BY di2.dialogue_id, di2.philosophical_question, di2.dialogue_type, td.philosophical_question
    )
    SELECT 
        dialogue_id,
        philosophical_question,
        dialogue_type,
        LEAST(
            text_similarity + (shared_concepts::DECIMAL / 10), 
            1.0
        )::DECIMAL(3,2) AS similarity_score,
        shared_concepts
    FROM dialogue_similarities
    WHERE text_similarity > 0.1 OR shared_concepts > 0
    ORDER BY similarity_score DESC, shared_concepts DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Create view for dialogue statistics
CREATE OR REPLACE VIEW dialogue_statistics AS
SELECT 
    dialogue_type,
    COUNT(*) AS total_dialogues,
    COUNT(*) FILTER (WHERE synthesis_achieved = TRUE) AS successful_syntheses,
    AVG(philosophical_depth) AS avg_philosophical_depth,
    AVG(logical_rigor) AS avg_logical_rigor,
    AVG(clarity_score) AS avg_clarity,
    AVG(productivity_score) AS avg_productivity,
    AVG(word_count) AS avg_word_count,
    AVG(turn_count) AS avg_turns,
    COUNT(*) FILTER (WHERE is_published = TRUE) AS published_count
FROM dialogue_interpretations
GROUP BY dialogue_type;

-- Create function to generate dialogue summary
CREATE OR REPLACE FUNCTION generate_dialogue_summary(
    p_dialogue_id UUID
)
RETURNS TABLE(
    question TEXT,
    participant_count INTEGER,
    main_positions TEXT[],
    key_agreements TEXT[],
    key_disagreements TEXT[],
    synthesis_achieved BOOLEAN,
    new_insights INTEGER,
    quality_score DECIMAL(3,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        di.philosophical_question AS question,
        COUNT(DISTINCT dp.concept_id)::INTEGER AS participant_count,
        ARRAY(
            SELECT DISTINCT arg->>'position'
            FROM jsonb_array_elements(di.arguments) arg
            LIMIT 3
        ) AS main_positions,
        array_slice(di.points_of_agreement, 1, 3) AS key_agreements,
        array_slice(di.points_of_disagreement, 1, 3) AS key_disagreements,
        di.synthesis_achieved,
        array_length(di.key_insights, 1) AS new_insights,
        ((di.philosophical_depth + di.logical_rigor + di.clarity_score + di.productivity_score) / 4)::DECIMAL(3,2) AS quality_score
    FROM dialogue_interpretations di
    LEFT JOIN dialogue_participants dp ON di.dialogue_id = dp.dialogue_id
    WHERE di.dialogue_id = p_dialogue_id
    GROUP BY di.dialogue_id;
END;
$$ LANGUAGE plpgsql;

-- Add comments
COMMENT ON TABLE dialogue_interpretations IS 'Philosophical dialogues exploring concepts through conversation';
COMMENT ON COLUMN dialogue_interpretations.dialogue_id IS 'Unique identifier for the dialogue';
COMMENT ON COLUMN dialogue_interpretations.philosophical_question IS 'Central question being explored';
COMMENT ON COLUMN dialogue_interpretations.dialogue_content IS 'Full text of the dialogue';
COMMENT ON COLUMN dialogue_interpretations.dialogue_structure IS 'Structured representation of dialogue turns';
COMMENT ON COLUMN dialogue_interpretations.discussion_points IS 'Key points raised in discussion';
COMMENT ON COLUMN dialogue_interpretations.arguments IS 'Formal arguments presented';
COMMENT ON COLUMN dialogue_interpretations.synthesis_achieved IS 'Whether dialogue reached synthesis';
COMMENT ON FUNCTION get_dialogue_argument_map IS 'Extract and analyze arguments from dialogue';
COMMENT ON FUNCTION find_related_dialogues IS 'Find dialogues on similar topics';
COMMENT ON VIEW dialogue_statistics IS 'Statistics about dialogue types and quality';