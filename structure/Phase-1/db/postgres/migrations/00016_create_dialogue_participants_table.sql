-- Migration: 00016_create_dialogue_participants_table
-- Created at: 2024-01-01
-- Description: Create junction table for dialogue participants (concepts participating in dialogues)

-- Create dialogue_participants table
CREATE TABLE IF NOT EXISTS dialogue_participants (
    -- Primary key
    participant_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Foreign keys
    dialogue_id UUID NOT NULL REFERENCES dialogue_interpretations(dialogue_id) ON DELETE CASCADE,
    concept_id UUID NOT NULL REFERENCES concepts(concept_id) ON DELETE CASCADE,
    
    -- Participant details
    speaker_name VARCHAR(255) NOT NULL, -- Name used in dialogue (e.g., "Phenomenologist", "Pragmatist")
    role dialogue_role NOT NULL DEFAULT 'proponent',
    
    -- Position and stance
    primary_position TEXT, -- Main position taken
    stance VARCHAR(50) CHECK (stance IN (
        'supportive',      -- Supports the main question/thesis
        'critical',        -- Critical of the main question/thesis
        'neutral',         -- Neutral explorer
        'dialectical',     -- Seeking synthesis
        'questioning',     -- Primarily asking questions
        'mediating'        -- Mediating between positions
    )),
    
    -- Key theses used
    key_theses JSONB DEFAULT '[]'::jsonb, -- Array of {thesis_id, thesis_text, usage_context}
    
    -- Rhetorical strategy
    rhetorical_approach VARCHAR(100), -- e.g., "analytical", "metaphorical", "systematic"
    argumentation_style VARCHAR(100), -- e.g., "deductive", "inductive", "abductive"
    
    -- Contribution metrics
    speaking_turns INTEGER DEFAULT 0,
    word_count INTEGER DEFAULT 0,
    questions_asked INTEGER DEFAULT 0,
    arguments_presented INTEGER DEFAULT 0,
    concessions_made INTEGER DEFAULT 0,
    
    -- Interaction patterns
    primary_interlocutor UUID REFERENCES dialogue_participants(participant_id), -- Main dialogue partner
    responds_to JSONB DEFAULT '[]'::jsonb, -- Array of participant_ids this participant responds to
    challenged_by JSONB DEFAULT '[]'::jsonb, -- Array of participant_ids that challenge this participant
    
    -- Evolution during dialogue
    position_evolution TEXT, -- How position changed during dialogue
    final_position TEXT, -- Final position at end of dialogue
    learnings_acknowledged TEXT[], -- What participant learned
    
    -- Quality of participation
    contribution_quality DECIMAL(3,2) CHECK (contribution_quality >= 0 AND contribution_quality <= 1),
    clarity_rating DECIMAL(3,2) CHECK (clarity_rating >= 0 AND clarity_rating <= 1),
    constructiveness_rating DECIMAL(3,2) CHECK (constructiveness_rating >= 0 AND constructiveness_rating <= 1),
    
    -- Character traits exhibited
    philosophical_virtues TEXT[], -- e.g., "intellectual humility", "precision", "openness"
    philosophical_vices TEXT[], -- e.g., "dogmatism", "obscurity", "strawmanning"
    
    -- Metadata
    participation_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Unique constraint to prevent duplicate participants
    CONSTRAINT unique_dialogue_concept_participant UNIQUE (dialogue_id, concept_id),
    
    -- Data validation constraints
    CONSTRAINT chk_key_theses_format CHECK (jsonb_typeof(key_theses) = 'array'),
    CONSTRAINT chk_responds_to_format CHECK (jsonb_typeof(responds_to) = 'array'),
    CONSTRAINT chk_challenged_by_format CHECK (jsonb_typeof(challenged_by) = 'array'),
    CONSTRAINT chk_metrics_positive CHECK (
        speaking_turns >= 0 AND
        word_count >= 0 AND
        questions_asked >= 0 AND
        arguments_presented >= 0 AND
        concessions_made >= 0
    )
);

-- Create indexes
CREATE INDEX idx_dialogue_participants_dialogue_id ON dialogue_participants(dialogue_id);
CREATE INDEX idx_dialogue_participants_concept_id ON dialogue_participants(concept_id);
CREATE INDEX idx_dialogue_participants_role ON dialogue_participants(role);
CREATE INDEX idx_dialogue_participants_stance ON dialogue_participants(stance);
CREATE INDEX idx_dialogue_participants_speaker_name ON dialogue_participants(speaker_name);
CREATE INDEX idx_dialogue_participants_interlocutor ON dialogue_participants(primary_interlocutor) WHERE primary_interlocutor IS NOT NULL;

-- Create function to validate participant data
CREATE OR REPLACE FUNCTION validate_dialogue_participant_data()
RETURNS TRIGGER AS $$
DECLARE
    thesis JSONB;
    participant_id TEXT;
BEGIN
    -- Validate key_theses structure
    FOR thesis IN SELECT jsonb_array_elements(NEW.key_theses)
    LOOP
        IF NOT (thesis ? 'thesis_text') THEN
            RAISE EXCEPTION 'Each key thesis must have thesis_text';
        END IF;
    END LOOP;
    
    -- Validate responds_to contains valid UUIDs
    FOR participant_id IN SELECT jsonb_array_elements_text(NEW.responds_to)
    LOOP
        BEGIN
            PERFORM participant_id::UUID;
        EXCEPTION WHEN OTHERS THEN
            RAISE EXCEPTION 'Invalid UUID in responds_to: %', participant_id;
        END;
    END LOOP;
    
    -- Validate challenged_by contains valid UUIDs  
    FOR participant_id IN SELECT jsonb_array_elements_text(NEW.challenged_by)
    LOOP
        BEGIN
            PERFORM participant_id::UUID;
        EXCEPTION WHEN OTHERS THEN
            RAISE EXCEPTION 'Invalid UUID in challenged_by: %', participant_id;
        END;
    END LOOP;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to validate data
CREATE TRIGGER validate_dialogue_participants_data
    BEFORE INSERT OR UPDATE ON dialogue_participants
    FOR EACH ROW
    EXECUTE FUNCTION validate_dialogue_participant_data();

-- Create function to calculate participation metrics
CREATE OR REPLACE FUNCTION calculate_participation_metrics()
RETURNS TRIGGER AS $$
DECLARE
    v_dialogue_structure JSONB;
    v_turn JSONB;
    v_turn_count INTEGER := 0;
    v_word_count INTEGER := 0;
    v_questions INTEGER := 0;
    v_arguments INTEGER := 0;
BEGIN
    -- Get dialogue structure
    SELECT dialogue_structure INTO v_dialogue_structure
    FROM dialogue_interpretations
    WHERE dialogue_id = NEW.dialogue_id;
    
    -- Calculate metrics from dialogue structure
    FOR v_turn IN SELECT jsonb_array_elements(v_dialogue_structure)
    LOOP
        IF v_turn->>'speaker' = NEW.speaker_name THEN
            v_turn_count := v_turn_count + 1;
            v_word_count := v_word_count + array_length(string_to_array(v_turn->>'text', ' '), 1);
            
            -- Count questions (simple heuristic)
            IF v_turn->>'text' LIKE '%?' THEN
                v_questions := v_questions + 1;
            END IF;
            
            -- Count arguments (if tagged)
            IF v_turn ? 'is_argument' AND (v_turn->>'is_argument')::boolean THEN
                v_arguments := v_arguments + 1;
            END IF;
        END IF;
    END LOOP;
    
    -- Update metrics
    NEW.speaking_turns := v_turn_count;
    NEW.word_count := v_word_count;
    NEW.questions_asked := v_questions;
    NEW.arguments_presented := v_arguments;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to calculate metrics
CREATE TRIGGER calculate_dialogue_participant_metrics
    BEFORE INSERT OR UPDATE ON dialogue_participants
    FOR EACH ROW
    EXECUTE FUNCTION calculate_participation_metrics();

-- Create function to analyze dialogue dynamics
CREATE OR REPLACE FUNCTION analyze_dialogue_dynamics(
    p_dialogue_id UUID
)
RETURNS TABLE(
    participant_name VARCHAR(255),
    concept_name VARCHAR(255),
    role dialogue_role,
    dominance_score DECIMAL(3,2),
    interaction_count INTEGER,
    initiated_exchanges INTEGER,
    responsive_ratio DECIMAL(3,2)
) AS $$
BEGIN
    RETURN QUERY
    WITH participant_stats AS (
        SELECT 
            dp.participant_id,
            dp.speaker_name,
            c.name AS concept_name,
            dp.role,
            dp.speaking_turns,
            dp.word_count,
            jsonb_array_length(dp.responds_to) AS response_count,
            jsonb_array_length(dp.challenged_by) AS challenged_count
        FROM dialogue_participants dp
        JOIN concepts c ON dp.concept_id = c.concept_id
        WHERE dp.dialogue_id = p_dialogue_id
    ),
    total_stats AS (
        SELECT 
            SUM(speaking_turns) AS total_turns,
            SUM(word_count) AS total_words
        FROM participant_stats
    )
    SELECT 
        ps.speaker_name AS participant_name,
        ps.concept_name,
        ps.role,
        CASE 
            WHEN ts.total_words > 0 
            THEN (ps.word_count::DECIMAL / ts.total_words)::DECIMAL(3,2)
            ELSE 0
        END AS dominance_score,
        (ps.response_count + ps.challenged_count)::INTEGER AS interaction_count,
        (ps.speaking_turns - ps.response_count)::INTEGER AS initiated_exchanges,
        CASE 
            WHEN ps.speaking_turns > 0
            THEN (ps.response_count::DECIMAL / ps.speaking_turns)::DECIMAL(3,2)
            ELSE 0
        END AS responsive_ratio
    FROM participant_stats ps
    CROSS JOIN total_stats ts
    ORDER BY dominance_score DESC;
END;
$$ LANGUAGE plpgsql;

-- Create function to get interaction network
CREATE OR REPLACE FUNCTION get_dialogue_interaction_network(
    p_dialogue_id UUID
)
RETURNS TABLE(
    from_participant UUID,
    from_name VARCHAR(255),
    to_participant UUID,
    to_name VARCHAR(255),
    interaction_type VARCHAR(20),
    interaction_count INTEGER
) AS $$
BEGIN
    RETURN QUERY
    -- Direct responses
    SELECT 
        dp1.participant_id AS from_participant,
        dp1.speaker_name AS from_name,
        resp_id::UUID AS to_participant,
        dp2.speaker_name AS to_name,
        'responds_to'::VARCHAR(20) AS interaction_type,
        1 AS interaction_count
    FROM dialogue_participants dp1,
         jsonb_array_elements_text(dp1.responds_to) resp_id
    JOIN dialogue_participants dp2 ON dp2.participant_id = resp_id::UUID
    WHERE dp1.dialogue_id = p_dialogue_id
    
    UNION ALL
    
    -- Challenges
    SELECT 
        challenger_id::UUID AS from_participant,
        dp2.speaker_name AS from_name,
        dp1.participant_id AS to_participant,
        dp1.speaker_name AS to_name,
        'challenges'::VARCHAR(20) AS interaction_type,
        1 AS interaction_count
    FROM dialogue_participants dp1,
         jsonb_array_elements_text(dp1.challenged_by) challenger_id
    JOIN dialogue_participants dp2 ON dp2.participant_id = challenger_id::UUID
    WHERE dp1.dialogue_id = p_dialogue_id
    
    ORDER BY from_name, interaction_type;
END;
$$ LANGUAGE plpgsql;

-- Create view for participant role distribution
CREATE OR REPLACE VIEW dialogue_role_statistics AS
SELECT 
    dp.role,
    COUNT(DISTINCT dp.dialogue_id) AS dialogue_count,
    COUNT(DISTINCT dp.concept_id) AS unique_concepts,
    AVG(dp.contribution_quality) AS avg_contribution_quality,
    AVG(dp.clarity_rating) AS avg_clarity,
    AVG(dp.constructiveness_rating) AS avg_constructiveness,
    SUM(dp.speaking_turns) AS total_speaking_turns,
    AVG(dp.speaking_turns) AS avg_turns_per_dialogue,
    SUM(dp.arguments_presented) AS total_arguments,
    SUM(dp.questions_asked) AS total_questions
FROM dialogue_participants dp
GROUP BY dp.role
ORDER BY dialogue_count DESC;

-- Create function to find concepts that dialogue well together
CREATE OR REPLACE FUNCTION find_good_dialogue_partners(
    p_concept_id UUID,
    p_min_quality DECIMAL(3,2) DEFAULT 0.7
)
RETURNS TABLE(
    partner_concept_id UUID,
    partner_concept_name VARCHAR(255),
    dialogue_count INTEGER,
    avg_quality DECIMAL(3,2),
    synthesis_rate DECIMAL(3,2),
    common_topics TEXT[]
) AS $$
BEGIN
    RETURN QUERY
    WITH concept_dialogues AS (
        SELECT DISTINCT
            dp1.dialogue_id,
            dp2.concept_id AS partner_id,
            c2.name AS partner_name,
            di.philosophical_question,
            di.synthesis_achieved,
            (dp1.contribution_quality + dp2.contribution_quality) / 2 AS dialogue_quality
        FROM dialogue_participants dp1
        JOIN dialogue_participants dp2 ON dp1.dialogue_id = dp2.dialogue_id AND dp1.concept_id != dp2.concept_id
        JOIN concepts c2 ON dp2.concept_id = c2.concept_id
        JOIN dialogue_interpretations di ON dp1.dialogue_id = di.dialogue_id
        WHERE dp1.concept_id = p_concept_id
        AND c2.deleted_at IS NULL
    )
    SELECT 
        partner_id AS partner_concept_id,
        partner_name AS partner_concept_name,
        COUNT(*) AS dialogue_count,
        AVG(dialogue_quality)::DECIMAL(3,2) AS avg_quality,
        (COUNT(*) FILTER (WHERE synthesis_achieved = TRUE)::DECIMAL / NULLIF(COUNT(*), 0))::DECIMAL(3,2) AS synthesis_rate,
        array_agg(DISTINCT 
            CASE 
                WHEN philosophical_question LIKE '%ethics%' THEN 'ethics'
                WHEN philosophical_question LIKE '%knowledge%' THEN 'epistemology'
                WHEN philosophical_question LIKE '%reality%' THEN 'metaphysics'
                WHEN philosophical_question LIKE '%beauty%' THEN 'aesthetics'
                ELSE 'general'
            END
        ) AS common_topics
    FROM concept_dialogues
    GROUP BY partner_id, partner_name
    HAVING AVG(dialogue_quality) >= p_min_quality
    ORDER BY dialogue_count DESC, avg_quality DESC;
END;
$$ LANGUAGE plpgsql;

-- Add comments
COMMENT ON TABLE dialogue_participants IS 'Tracks participation of concepts in philosophical dialogues';
COMMENT ON COLUMN dialogue_participants.participant_id IS 'Unique identifier for the participation record';
COMMENT ON COLUMN dialogue_participants.speaker_name IS 'Name used by this concept in the dialogue';
COMMENT ON COLUMN dialogue_participants.role IS 'Role played in the dialogue';
COMMENT ON COLUMN dialogue_participants.key_theses IS 'Key theses from the concept used in dialogue';
COMMENT ON COLUMN dialogue_participants.primary_interlocutor IS 'Main dialogue partner';
COMMENT ON COLUMN dialogue_participants.contribution_quality IS 'Quality of contribution to dialogue (0-1)';
COMMENT ON FUNCTION analyze_dialogue_dynamics IS 'Analyze participation dynamics in a dialogue';
COMMENT ON FUNCTION get_dialogue_interaction_network IS 'Get interaction network for a dialogue';
COMMENT ON FUNCTION find_good_dialogue_partners IS 'Find concepts that dialogue well with given concept';
COMMENT ON VIEW dialogue_role_statistics IS 'Statistics about different dialogue roles';