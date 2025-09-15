-- Migration: 00008_create_claude_interactions_table
-- Created at: 2024-01-01
-- Description: Create table to track all interactions with Claude API

-- Create enum for query types
CREATE TYPE claude_query_type AS ENUM (
    -- Graph-related queries
    'graph_validation',
    'graph_enrichment',
    'category_enrichment',
    'relationship_analysis',
    'graph_from_thesis',
    
    -- Thesis-related queries
    'thesis_generation',
    'thesis_elaboration',
    'thesis_comparison',
    'thesis_validation',
    
    -- Synthesis queries
    'compatibility_analysis',
    'concept_synthesis',
    'synthesis_critique',
    'parent_identification',
    
    -- Analysis queries
    'name_analysis',
    'origin_detection',
    'historical_context',
    'practical_application',
    'dialogue_generation',
    'evolution_analysis',
    
    -- General queries
    'free_form_query',
    'template_query',
    'batch_processing'
);

-- Create enum for interaction status
CREATE TYPE interaction_status AS ENUM (
    'pending',
    'processing',
    'completed',
    'failed',
    'cancelled',
    'timeout'
);

-- Create claude_interactions table
CREATE TABLE IF NOT EXISTS claude_interactions (
    -- Primary key
    interaction_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- User and concept references
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    concept_id UUID REFERENCES concepts(concept_id) ON DELETE SET NULL,
    
    -- Query details
    query_type claude_query_type NOT NULL,
    query_content TEXT NOT NULL,
    query_template VARCHAR(255), -- Template name if used
    query_parameters JSONB DEFAULT '{}',
    
    -- Response details
    response_content TEXT,
    response_metadata JSONB DEFAULT '{}',
    
    -- API key information
    used_user_key BOOLEAN DEFAULT FALSE, -- Whether user's own API key was used
    api_key_owner_id UUID REFERENCES users(user_id), -- Owner of the API key used
    
    -- Processing details
    status interaction_status DEFAULT 'pending',
    interaction_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE,
    processing_time_ms INTEGER, -- Time taken to process
    
    -- Token usage and costs
    input_tokens INTEGER,
    output_tokens INTEGER,
    total_tokens INTEGER,
    estimated_cost DECIMAL(10,4), -- Estimated cost in USD
    
    -- Error handling
    error_message TEXT,
    error_code VARCHAR(50),
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    
    -- Queue information (for async processing)
    queue_id VARCHAR(255),
    priority INTEGER DEFAULT 5 CHECK (priority >= 1 AND priority <= 10),
    
    -- Model information
    model_version VARCHAR(50) DEFAULT 'claude-3-opus-20240229',
    temperature DECIMAL(3,2),
    max_tokens INTEGER,
    
    -- Related interactions (for conversation threads)
    parent_interaction_id UUID REFERENCES claude_interactions(interaction_id),
    conversation_id UUID,
    
    -- Metadata
    client_request_id UUID, -- ID from client for tracking
    tags TEXT[],
    is_test BOOLEAN DEFAULT FALSE,
    
    -- Constraints
    CONSTRAINT chk_query_parameters CHECK (jsonb_typeof(query_parameters) = 'object'),
    CONSTRAINT chk_response_metadata CHECK (jsonb_typeof(response_metadata) = 'object'),
    CONSTRAINT chk_token_counts CHECK (
        (input_tokens IS NULL AND output_tokens IS NULL AND total_tokens IS NULL) OR
        (input_tokens >= 0 AND output_tokens >= 0 AND total_tokens = input_tokens + output_tokens)
    ),
    CONSTRAINT chk_cost_positive CHECK (estimated_cost IS NULL OR estimated_cost >= 0),
    CONSTRAINT chk_processing_time CHECK (processing_time_ms IS NULL OR processing_time_ms >= 0)
);

-- Create indexes
CREATE INDEX idx_claude_interactions_user_id ON claude_interactions(user_id);
CREATE INDEX idx_claude_interactions_concept_id ON claude_interactions(concept_id) WHERE concept_id IS NOT NULL;
CREATE INDEX idx_claude_interactions_query_type ON claude_interactions(query_type);
CREATE INDEX idx_claude_interactions_status ON claude_interactions(status);
CREATE INDEX idx_claude_interactions_interaction_date ON claude_interactions(interaction_date DESC);
CREATE INDEX idx_claude_interactions_conversation ON claude_interactions(conversation_id) WHERE conversation_id IS NOT NULL;
CREATE INDEX idx_claude_interactions_queue ON claude_interactions(queue_id) WHERE queue_id IS NOT NULL;
CREATE INDEX idx_claude_interactions_pending ON claude_interactions(status, priority DESC) WHERE status = 'pending';
CREATE INDEX idx_claude_interactions_api_key_owner ON claude_interactions(api_key_owner_id) WHERE api_key_owner_id IS NOT NULL;

-- Create function to update processing metrics
CREATE OR REPLACE FUNCTION update_interaction_completion()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        NEW.completed_at = CURRENT_TIMESTAMP;
        NEW.processing_time_ms = EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - NEW.interaction_date)) * 1000;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update completion metrics
CREATE TRIGGER update_claude_interaction_completion
    BEFORE UPDATE ON claude_interactions
    FOR EACH ROW
    WHEN (NEW.status IS DISTINCT FROM OLD.status)
    EXECUTE FUNCTION update_interaction_completion();

-- Create function to estimate cost based on token usage
CREATE OR REPLACE FUNCTION estimate_claude_cost(
    p_input_tokens INTEGER,
    p_output_tokens INTEGER,
    p_model_version VARCHAR(50) DEFAULT 'claude-3-opus-20240229'
)
RETURNS DECIMAL(10,4) AS $$
DECLARE
    v_input_cost_per_1k DECIMAL(10,6);
    v_output_cost_per_1k DECIMAL(10,6);
    v_total_cost DECIMAL(10,4);
BEGIN
    -- Set pricing based on model (as of 2024-01)
    -- These should be updated based on current Anthropic pricing
    CASE p_model_version
        WHEN 'claude-3-opus-20240229' THEN
            v_input_cost_per_1k := 0.015; -- $15 per million input tokens
            v_output_cost_per_1k := 0.075; -- $75 per million output tokens
        WHEN 'claude-3-sonnet-20240229' THEN
            v_input_cost_per_1k := 0.003; -- $3 per million input tokens
            v_output_cost_per_1k := 0.015; -- $15 per million output tokens
        ELSE
            -- Default to Opus pricing
            v_input_cost_per_1k := 0.015;
            v_output_cost_per_1k := 0.075;
    END CASE;
    
    -- Calculate total cost
    v_total_cost := (p_input_tokens::DECIMAL / 1000 * v_input_cost_per_1k) + 
                    (p_output_tokens::DECIMAL / 1000 * v_output_cost_per_1k);
    
    RETURN v_total_cost;
END;
$$ LANGUAGE plpgsql;

-- Create function to get interaction statistics
CREATE OR REPLACE FUNCTION get_claude_interaction_stats(
    p_user_id UUID DEFAULT NULL,
    p_start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW() - INTERVAL '30 days',
    p_end_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)
RETURNS TABLE(
    query_type claude_query_type,
    total_interactions BIGINT,
    successful_interactions BIGINT,
    failed_interactions BIGINT,
    avg_processing_time_ms NUMERIC,
    total_input_tokens BIGINT,
    total_output_tokens BIGINT,
    total_cost DECIMAL(10,2),
    avg_tokens_per_query NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ci.query_type,
        COUNT(*) AS total_interactions,
        COUNT(*) FILTER (WHERE ci.status = 'completed') AS successful_interactions,
        COUNT(*) FILTER (WHERE ci.status IN ('failed', 'timeout')) AS failed_interactions,
        AVG(ci.processing_time_ms)::NUMERIC AS avg_processing_time_ms,
        SUM(ci.input_tokens) AS total_input_tokens,
        SUM(ci.output_tokens) AS total_output_tokens,
        SUM(ci.estimated_cost) AS total_cost,
        AVG(ci.total_tokens)::NUMERIC AS avg_tokens_per_query
    FROM claude_interactions ci
    WHERE 
        (p_user_id IS NULL OR ci.user_id = p_user_id) AND
        ci.interaction_date >= p_start_date AND
        ci.interaction_date <= p_end_date AND
        ci.is_test = FALSE
    GROUP BY ci.query_type
    ORDER BY total_interactions DESC;
END;
$$ LANGUAGE plpgsql;

-- Create function to get pending tasks for processing
CREATE OR REPLACE FUNCTION get_pending_claude_tasks(
    p_limit INTEGER DEFAULT 10
)
RETURNS TABLE(
    interaction_id UUID,
    user_id UUID,
    query_type claude_query_type,
    query_content TEXT,
    priority INTEGER,
    retry_count INTEGER,
    created_ago INTERVAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ci.interaction_id,
        ci.user_id,
        ci.query_type,
        ci.query_content,
        ci.priority,
        ci.retry_count,
        NOW() - ci.interaction_date AS created_ago
    FROM claude_interactions ci
    WHERE 
        ci.status = 'pending' AND
        ci.retry_count < ci.max_retries
    ORDER BY 
        ci.priority DESC,
        ci.interaction_date ASC
    LIMIT p_limit
    FOR UPDATE SKIP LOCKED; -- Prevent concurrent processing
END;
$$ LANGUAGE plpgsql;

-- Create view for daily Claude usage
CREATE OR REPLACE VIEW daily_claude_usage AS
SELECT 
    DATE(interaction_date) AS usage_date,
    COUNT(*) AS total_requests,
    COUNT(DISTINCT user_id) AS unique_users,
    COUNT(*) FILTER (WHERE used_user_key = TRUE) AS user_key_requests,
    COUNT(*) FILTER (WHERE used_user_key = FALSE) AS system_key_requests,
    SUM(input_tokens) AS total_input_tokens,
    SUM(output_tokens) AS total_output_tokens,
    SUM(estimated_cost) AS total_cost,
    AVG(processing_time_ms) AS avg_processing_time_ms,
    COUNT(*) FILTER (WHERE status = 'completed') AS successful_requests,
    COUNT(*) FILTER (WHERE status IN ('failed', 'timeout')) AS failed_requests
FROM claude_interactions
WHERE is_test = FALSE
GROUP BY DATE(interaction_date);

-- Create index on the view's underlying data
CREATE INDEX idx_claude_interactions_daily_usage ON claude_interactions(DATE(interaction_date), used_user_key) WHERE is_test = FALSE;

-- Add comments
COMMENT ON TABLE claude_interactions IS 'Tracks all interactions with Claude API for auditing and cost management';
COMMENT ON COLUMN claude_interactions.interaction_id IS 'Unique identifier for the interaction';
COMMENT ON COLUMN claude_interactions.query_type IS 'Type of query sent to Claude';
COMMENT ON COLUMN claude_interactions.query_content IS 'The actual query sent to Claude';
COMMENT ON COLUMN claude_interactions.response_content IS 'The response received from Claude';
COMMENT ON COLUMN claude_interactions.used_user_key IS 'Whether user''s own API key was used';
COMMENT ON COLUMN claude_interactions.api_key_owner_id IS 'User who owns the API key that was used';
COMMENT ON COLUMN claude_interactions.total_tokens IS 'Total tokens used (input + output)';
COMMENT ON COLUMN claude_interactions.estimated_cost IS 'Estimated cost in USD based on token usage';
COMMENT ON COLUMN claude_interactions.conversation_id IS 'Groups related interactions into conversations';
COMMENT ON FUNCTION estimate_claude_cost IS 'Estimates cost based on token usage and model';
COMMENT ON FUNCTION get_claude_interaction_stats IS 'Get statistics about Claude usage';
COMMENT ON FUNCTION get_pending_claude_tasks IS 'Get pending tasks for async processing';
COMMENT ON VIEW daily_claude_usage IS 'Daily aggregated Claude API usage statistics';