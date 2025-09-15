-- Migration: 00021_create_api_key_usage_table
-- Created at: 2024-01-01
-- Description: Create table for tracking API key usage and costs

-- Create enum for key source types
CREATE TYPE api_key_source AS ENUM (
    'user_own',      -- User's own API key
    'user_shared',   -- Shared API key from another user
    'system'         -- System API key
);

-- Create api_key_usage table
CREATE TABLE IF NOT EXISTS api_key_usage (
    -- Primary key
    usage_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- User reference
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    
    -- Usage timestamp
    usage_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Operation details
    operation_type VARCHAR(100) NOT NULL, -- Same as claude_query_type values
    interaction_id UUID REFERENCES claude_interactions(interaction_id),
    
    -- Key source information
    key_source api_key_source NOT NULL,
    key_owner_id UUID REFERENCES users(user_id), -- Who owns the key (NULL for system)
    share_id UUID REFERENCES shared_api_keys(share_id), -- If using shared key
    
    -- Token usage
    tokens_used INTEGER NOT NULL CHECK (tokens_used >= 0),
    input_tokens INTEGER CHECK (input_tokens >= 0),
    output_tokens INTEGER CHECK (output_tokens >= 0),
    
    -- Cost calculation
    estimated_cost DECIMAL(10,4) CHECK (estimated_cost >= 0),
    cost_currency VARCHAR(3) DEFAULT 'USD',
    
    -- Related entities
    concept_id UUID REFERENCES concepts(concept_id) ON DELETE SET NULL,
    
    -- Request details
    model_used VARCHAR(50),
    request_successful BOOLEAN DEFAULT TRUE,
    error_message TEXT,
    
    -- Response time
    response_time_ms INTEGER CHECK (response_time_ms >= 0),
    
    -- Billing period (for aggregation)
    billing_period DATE DEFAULT DATE_TRUNC('month', CURRENT_DATE),
    
    -- Metadata
    request_metadata JSONB DEFAULT '{}',
    
    -- Constraints
    CONSTRAINT chk_token_consistency CHECK (
        (input_tokens IS NULL AND output_tokens IS NULL) OR
        (tokens_used = COALESCE(input_tokens, 0) + COALESCE(output_tokens, 0))
    ),
    CONSTRAINT chk_key_source_consistency CHECK (
        (key_source = 'system' AND key_owner_id IS NULL AND share_id IS NULL) OR
        (key_source = 'user_own' AND key_owner_id = user_id AND share_id IS NULL) OR
        (key_source = 'user_shared' AND key_owner_id IS NOT NULL AND share_id IS NOT NULL)
    ),
    CONSTRAINT chk_metadata_format CHECK (jsonb_typeof(request_metadata) = 'object')
);

-- Create indexes
CREATE INDEX idx_api_key_usage_user_id ON api_key_usage(user_id);
CREATE INDEX idx_api_key_usage_date ON api_key_usage(usage_date DESC);
CREATE INDEX idx_api_key_usage_billing_period ON api_key_usage(billing_period, user_id);
CREATE INDEX idx_api_key_usage_key_owner ON api_key_usage(key_owner_id) WHERE key_owner_id IS NOT NULL;
CREATE INDEX idx_api_key_usage_share_id ON api_key_usage(share_id) WHERE share_id IS NOT NULL;
CREATE INDEX idx_api_key_usage_concept ON api_key_usage(concept_id) WHERE concept_id IS NOT NULL;
CREATE INDEX idx_api_key_usage_operation ON api_key_usage(operation_type);
CREATE INDEX idx_api_key_usage_interaction ON api_key_usage(interaction_id) WHERE interaction_id IS NOT NULL;

-- Create composite index for common queries
CREATE INDEX idx_api_key_usage_user_period_cost ON api_key_usage(user_id, billing_period, estimated_cost);

-- Create function to record API key usage
CREATE OR REPLACE FUNCTION record_api_key_usage(
    p_user_id UUID,
    p_operation_type VARCHAR(100),
    p_tokens_used INTEGER,
    p_key_source api_key_source,
    p_key_owner_id UUID DEFAULT NULL,
    p_share_id UUID DEFAULT NULL,
    p_concept_id UUID DEFAULT NULL,
    p_interaction_id UUID DEFAULT NULL,
    p_model_used VARCHAR(50) DEFAULT 'claude-3-opus-20240229',
    p_input_tokens INTEGER DEFAULT NULL,
    p_output_tokens INTEGER DEFAULT NULL,
    p_response_time_ms INTEGER DEFAULT NULL,
    p_request_successful BOOLEAN DEFAULT TRUE,
    p_error_message TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_usage_id UUID;
    v_estimated_cost DECIMAL(10,4);
BEGIN
    -- Calculate estimated cost
    v_estimated_cost := estimate_claude_cost(
        COALESCE(p_input_tokens, p_tokens_used),
        COALESCE(p_output_tokens, 0),
        p_model_used
    );
    
    -- Insert usage record
    INSERT INTO api_key_usage (
        user_id,
        operation_type,
        tokens_used,
        input_tokens,
        output_tokens,
        estimated_cost,
        key_source,
        key_owner_id,
        share_id,
        concept_id,
        interaction_id,
        model_used,
        response_time_ms,
        request_successful,
        error_message
    ) VALUES (
        p_user_id,
        p_operation_type,
        p_tokens_used,
        p_input_tokens,
        p_output_tokens,
        v_estimated_cost,
        p_key_source,
        p_key_owner_id,
        p_share_id,
        p_concept_id,
        p_interaction_id,
        p_model_used,
        p_response_time_ms,
        p_request_successful,
        p_error_message
    ) RETURNING usage_id INTO v_usage_id;
    
    -- Update last used timestamp for user's own key
    IF p_key_source = 'user_own' THEN
        PERFORM update_api_key_last_used(p_user_id);
    END IF;
    
    -- Update shared key usage if applicable
    IF p_share_id IS NOT NULL THEN
        UPDATE shared_api_keys
        SET 
            total_uses = total_uses + 1,
            last_used_at = CURRENT_TIMESTAMP
        WHERE share_id = p_share_id;
    END IF;
    
    RETURN v_usage_id;
END;
$$ LANGUAGE plpgsql;

-- Create function to get usage summary for user
CREATE OR REPLACE FUNCTION get_user_api_usage_summary(
    p_user_id UUID,
    p_start_date DATE DEFAULT DATE_TRUNC('month', CURRENT_DATE),
    p_end_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE(
    period DATE,
    total_requests BIGINT,
    successful_requests BIGINT,
    failed_requests BIGINT,
    total_tokens BIGINT,
    total_cost DECIMAL(10,2),
    own_key_requests BIGINT,
    shared_key_requests BIGINT,
    system_key_requests BIGINT,
    avg_response_time_ms NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        billing_period AS period,
        COUNT(*) AS total_requests,
        COUNT(*) FILTER (WHERE request_successful = TRUE) AS successful_requests,
        COUNT(*) FILTER (WHERE request_successful = FALSE) AS failed_requests,
        SUM(tokens_used) AS total_tokens,
        SUM(estimated_cost) AS total_cost,
        COUNT(*) FILTER (WHERE key_source = 'user_own') AS own_key_requests,
        COUNT(*) FILTER (WHERE key_source = 'user_shared') AS shared_key_requests,
        COUNT(*) FILTER (WHERE key_source = 'system') AS system_key_requests,
        AVG(response_time_ms)::NUMERIC AS avg_response_time_ms
    FROM api_key_usage
    WHERE user_id = p_user_id
    AND billing_period >= p_start_date
    AND billing_period <= p_end_date
    GROUP BY billing_period
    ORDER BY billing_period DESC;
END;
$$ LANGUAGE plpgsql;

-- Create function to get shared key usage details
CREATE OR REPLACE FUNCTION get_shared_key_usage_details(
    p_share_id UUID,
    p_start_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_DATE - INTERVAL '30 days',
    p_end_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
)
RETURNS TABLE(
    usage_date TIMESTAMP WITH TIME ZONE,
    user_id UUID,
    username VARCHAR(50),
    operation_type VARCHAR(100),
    tokens_used INTEGER,
    estimated_cost DECIMAL(10,4),
    concept_name VARCHAR(255)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        aku.usage_date,
        aku.user_id,
        u.username,
        aku.operation_type,
        aku.tokens_used,
        aku.estimated_cost,
        c.name AS concept_name
    FROM api_key_usage aku
    JOIN users u ON aku.user_id = u.user_id
    LEFT JOIN concepts c ON aku.concept_id = c.concept_id
    WHERE aku.share_id = p_share_id
    AND aku.usage_date >= p_start_date
    AND aku.usage_date <= p_end_date
    ORDER BY aku.usage_date DESC;
END;
$$ LANGUAGE plpgsql;

-- Create function to get cost breakdown by operation
CREATE OR REPLACE FUNCTION get_cost_breakdown_by_operation(
    p_user_id UUID DEFAULT NULL,
    p_billing_period DATE DEFAULT DATE_TRUNC('month', CURRENT_DATE)
)
RETURNS TABLE(
    operation_type VARCHAR(100),
    request_count BIGINT,
    total_tokens BIGINT,
    total_cost DECIMAL(10,2),
    avg_tokens_per_request NUMERIC,
    avg_cost_per_request DECIMAL(10,4)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        aku.operation_type,
        COUNT(*) AS request_count,
        SUM(aku.tokens_used) AS total_tokens,
        SUM(aku.estimated_cost) AS total_cost,
        AVG(aku.tokens_used)::NUMERIC AS avg_tokens_per_request,
        AVG(aku.estimated_cost)::DECIMAL(10,4) AS avg_cost_per_request
    FROM api_key_usage aku
    WHERE (p_user_id IS NULL OR aku.user_id = p_user_id)
    AND aku.billing_period = p_billing_period
    AND aku.request_successful = TRUE
    GROUP BY aku.operation_type
    ORDER BY total_cost DESC;
END;
$$ LANGUAGE plpgsql;

-- Create view for current month usage
CREATE OR REPLACE VIEW current_month_api_usage AS
SELECT 
    u.user_id,
    u.username,
    COUNT(aku.usage_id) AS request_count,
    SUM(aku.tokens_used) AS tokens_used,
    SUM(aku.estimated_cost) AS total_cost,
    COUNT(*) FILTER (WHERE aku.key_source = 'user_own') AS own_key_uses,
    COUNT(*) FILTER (WHERE aku.key_source = 'user_shared') AS shared_key_uses,
    COUNT(*) FILTER (WHERE aku.key_source = 'system') AS system_key_uses
FROM users u
LEFT JOIN api_key_usage aku ON u.user_id = aku.user_id 
    AND aku.billing_period = DATE_TRUNC('month', CURRENT_DATE)
WHERE u.deleted_at IS NULL
GROUP BY u.user_id, u.username
HAVING COUNT(aku.usage_id) > 0
ORDER BY total_cost DESC;

-- Create view for key owner statistics
CREATE OR REPLACE VIEW api_key_owner_statistics AS
SELECT 
    ko.user_id AS key_owner_id,
    ko.username AS key_owner_username,
    COUNT(DISTINCT aku.user_id) AS unique_users,
    COUNT(aku.usage_id) AS total_uses,
    SUM(aku.tokens_used) AS total_tokens,
    SUM(aku.estimated_cost) AS total_cost,
    COUNT(DISTINCT aku.share_id) AS active_shares,
    MAX(aku.usage_date) AS last_used
FROM api_key_usage aku
JOIN users ko ON aku.key_owner_id = ko.user_id
WHERE aku.key_source = 'user_shared'
GROUP BY ko.user_id, ko.username;

-- Create function to check usage limits
CREATE OR REPLACE FUNCTION check_api_usage_limits(
    p_user_id UUID,
    p_daily_limit INTEGER DEFAULT 1000,
    p_monthly_cost_limit DECIMAL(10,2) DEFAULT 100.00
)
RETURNS TABLE(
    daily_requests INTEGER,
    monthly_cost DECIMAL(10,2),
    daily_limit_exceeded BOOLEAN,
    monthly_limit_exceeded BOOLEAN
) AS $$
DECLARE
    v_daily_requests INTEGER;
    v_monthly_cost DECIMAL(10,2);
BEGIN
    -- Get daily request count
    SELECT COUNT(*)
    INTO v_daily_requests
    FROM api_key_usage
    WHERE user_id = p_user_id
    AND DATE(usage_date) = CURRENT_DATE;
    
    -- Get monthly cost
    SELECT COALESCE(SUM(estimated_cost), 0)
    INTO v_monthly_cost
    FROM api_key_usage
    WHERE user_id = p_user_id
    AND billing_period = DATE_TRUNC('month', CURRENT_DATE);
    
    RETURN QUERY
    SELECT 
        v_daily_requests,
        v_monthly_cost,
        v_daily_requests >= p_daily_limit,
        v_monthly_cost >= p_monthly_cost_limit;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update interaction with usage info
CREATE OR REPLACE FUNCTION update_interaction_usage_info()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the claude_interaction with token and cost info if linked
    IF NEW.interaction_id IS NOT NULL THEN
        UPDATE claude_interactions
        SET 
            input_tokens = COALESCE(NEW.input_tokens, input_tokens),
            output_tokens = COALESCE(NEW.output_tokens, output_tokens),
            total_tokens = NEW.tokens_used,
            estimated_cost = NEW.estimated_cost,
            api_key_owner_id = NEW.key_owner_id,
            used_user_key = (NEW.key_source != 'system')
        WHERE interaction_id = NEW.interaction_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER update_interaction_usage
    AFTER INSERT ON api_key_usage
    FOR EACH ROW
    WHEN (NEW.interaction_id IS NOT NULL)
    EXECUTE FUNCTION update_interaction_usage_info();

-- Add comments
COMMENT ON TABLE api_key_usage IS 'Detailed tracking of API key usage and costs';
COMMENT ON COLUMN api_key_usage.usage_id IS 'Unique identifier for the usage record';
COMMENT ON COLUMN api_key_usage.key_source IS 'Source of the API key used';
COMMENT ON COLUMN api_key_usage.key_owner_id IS 'User who owns the API key';
COMMENT ON COLUMN api_key_usage.share_id IS 'Reference to shared key if applicable';
COMMENT ON COLUMN api_key_usage.tokens_used IS 'Total tokens consumed in the request';
COMMENT ON COLUMN api_key_usage.estimated_cost IS 'Estimated cost in USD';
COMMENT ON COLUMN api_key_usage.billing_period IS 'Month for billing aggregation';
COMMENT ON FUNCTION record_api_key_usage IS 'Record a new API key usage';
COMMENT ON FUNCTION get_user_api_usage_summary IS 'Get usage summary for a user';
COMMENT ON FUNCTION get_cost_breakdown_by_operation IS 'Get cost breakdown by operation type';
COMMENT ON VIEW current_month_api_usage IS 'Current month API usage by user';
COMMENT ON VIEW api_key_owner_statistics IS 'Statistics for API key owners whose keys are shared';