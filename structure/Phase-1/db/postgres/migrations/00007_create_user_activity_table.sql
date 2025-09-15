-- Migration: 00007_create_user_activity_table
-- Created at: 2024-01-01
-- Description: Create user activity tracking table for audit and analytics

-- Create enum for activity types
CREATE TYPE activity_type_enum AS ENUM (
    -- Authentication activities
    'user_login',
    'user_logout',
    'user_register',
    'password_reset',
    'password_changed',
    'email_verified',
    'api_key_added',
    'api_key_removed',
    'api_key_shared',
    
    -- Concept activities
    'concept_created',
    'concept_updated',
    'concept_deleted',
    'concept_viewed',
    'concept_exported',
    'concept_published',
    'concept_unpublished',
    
    -- Graph activities
    'graph_created',
    'graph_updated',
    'graph_deleted',
    'category_added',
    'category_updated',
    'category_deleted',
    'relationship_added',
    'relationship_updated',
    'relationship_deleted',
    'graph_validated',
    'graph_enriched',
    
    -- Thesis activities
    'thesis_created',
    'thesis_updated',
    'thesis_deleted',
    'thesis_generated',
    'thesis_elaborated',
    'thesis_compared',
    
    -- Synthesis activities
    'synthesis_initiated',
    'synthesis_completed',
    'synthesis_failed',
    'compatibility_analyzed',
    'concept_critiqued',
    
    -- Analysis activities
    'name_analyzed',
    'origin_detected',
    'historical_context_analyzed',
    'practical_application_analyzed',
    'dialogue_generated',
    'evolution_analyzed',
    
    -- Claude interaction activities
    'claude_request_sent',
    'claude_response_received',
    'claude_task_queued',
    'claude_task_completed',
    'claude_error',
    
    -- Collaboration activities
    'concept_shared',
    'comment_added',
    'comment_updated',
    'comment_deleted',
    
    -- System activities
    'settings_updated',
    'export_requested',
    'import_completed',
    'bulk_operation_performed'
);

-- Create user_activity table
CREATE TABLE IF NOT EXISTS user_activity (
    -- Primary key
    activity_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- User reference
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    
    -- Activity details
    activity_type activity_type_enum NOT NULL,
    activity_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Target of the activity (polymorphic reference)
    target_id UUID, -- Can reference concept_id, graph_id, thesis_id, etc.
    target_type VARCHAR(50), -- 'concept', 'graph', 'thesis', 'user', etc.
    
    -- Additional activity details
    details JSONB DEFAULT '{}',
    
    -- Request information
    ip_address INET,
    user_agent TEXT,
    session_id VARCHAR(255),
    request_id UUID,
    
    -- Performance metrics
    duration_ms INTEGER, -- How long the activity took
    
    -- Result of the activity
    success BOOLEAN DEFAULT TRUE,
    error_message TEXT,
    error_code VARCHAR(50),
    
    -- Metadata
    app_version VARCHAR(20),
    api_version VARCHAR(20),
    
    -- Indexes will be created below
    CONSTRAINT chk_target_consistency CHECK (
        (target_id IS NULL AND target_type IS NULL) OR
        (target_id IS NOT NULL AND target_type IS NOT NULL)
    ),
    CONSTRAINT chk_details_format CHECK (jsonb_typeof(details) = 'object')
);

-- Create indexes for efficient querying
CREATE INDEX idx_user_activity_user_id ON user_activity(user_id);
CREATE INDEX idx_user_activity_activity_type ON user_activity(activity_type);
CREATE INDEX idx_user_activity_activity_date ON user_activity(activity_date DESC);
CREATE INDEX idx_user_activity_target ON user_activity(target_id, target_type) WHERE target_id IS NOT NULL;
CREATE INDEX idx_user_activity_session ON user_activity(session_id) WHERE session_id IS NOT NULL;
CREATE INDEX idx_user_activity_success ON user_activity(success) WHERE success = FALSE;
CREATE INDEX idx_user_activity_user_date ON user_activity(user_id, activity_date DESC);

-- Create partial indexes for common queries
CREATE INDEX idx_user_activity_concept_views ON user_activity(target_id, activity_date DESC) 
    WHERE activity_type = 'concept_viewed' AND target_type = 'concept';
CREATE INDEX idx_user_activity_claude_requests ON user_activity(user_id, activity_date DESC) 
    WHERE activity_type IN ('claude_request_sent', 'claude_response_received');
CREATE INDEX idx_user_activity_errors ON user_activity(user_id, activity_date DESC) 
    WHERE success = FALSE;

-- Create function to log activity
CREATE OR REPLACE FUNCTION log_user_activity(
    p_user_id UUID,
    p_activity_type activity_type_enum,
    p_target_id UUID DEFAULT NULL,
    p_target_type VARCHAR(50) DEFAULT NULL,
    p_details JSONB DEFAULT '{}',
    p_success BOOLEAN DEFAULT TRUE,
    p_error_message TEXT DEFAULT NULL,
    p_duration_ms INTEGER DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_activity_id UUID;
BEGIN
    INSERT INTO user_activity (
        user_id,
        activity_type,
        target_id,
        target_type,
        details,
        success,
        error_message,
        duration_ms
    ) VALUES (
        p_user_id,
        p_activity_type,
        p_target_id,
        p_target_type,
        p_details,
        p_success,
        p_error_message,
        p_duration_ms
    ) RETURNING activity_id INTO v_activity_id;
    
    RETURN v_activity_id;
END;
$$ LANGUAGE plpgsql;

-- Create function to get user activity summary
CREATE OR REPLACE FUNCTION get_user_activity_summary(
    p_user_id UUID,
    p_start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW() - INTERVAL '30 days',
    p_end_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)
RETURNS TABLE(
    activity_type activity_type_enum,
    activity_count BIGINT,
    success_count BIGINT,
    failure_count BIGINT,
    avg_duration_ms NUMERIC,
    last_activity TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ua.activity_type,
        COUNT(*) AS activity_count,
        COUNT(*) FILTER (WHERE ua.success = TRUE) AS success_count,
        COUNT(*) FILTER (WHERE ua.success = FALSE) AS failure_count,
        AVG(ua.duration_ms)::NUMERIC AS avg_duration_ms,
        MAX(ua.activity_date) AS last_activity
    FROM user_activity ua
    WHERE 
        ua.user_id = p_user_id AND
        ua.activity_date >= p_start_date AND
        ua.activity_date <= p_end_date
    GROUP BY ua.activity_type
    ORDER BY activity_count DESC;
END;
$$ LANGUAGE plpgsql;

-- Create function to get concept view statistics
CREATE OR REPLACE FUNCTION get_concept_view_stats(
    p_concept_id UUID,
    p_days INTEGER DEFAULT 30
)
RETURNS TABLE(
    view_date DATE,
    view_count BIGINT,
    unique_viewers BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        DATE(activity_date) AS view_date,
        COUNT(*) AS view_count,
        COUNT(DISTINCT user_id) AS unique_viewers
    FROM user_activity
    WHERE 
        activity_type = 'concept_viewed' AND
        target_id = p_concept_id AND
        target_type = 'concept' AND
        activity_date >= CURRENT_DATE - INTERVAL '1 day' * p_days
    GROUP BY DATE(activity_date)
    ORDER BY view_date DESC;
END;
$$ LANGUAGE plpgsql;

-- Create function to clean old activity logs
CREATE OR REPLACE FUNCTION cleanup_old_activity_logs(
    p_retention_days INTEGER DEFAULT 365
)
RETURNS INTEGER AS $$
DECLARE
    v_deleted_count INTEGER;
BEGIN
    DELETE FROM user_activity
    WHERE activity_date < CURRENT_TIMESTAMP - INTERVAL '1 day' * p_retention_days;
    
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    
    RETURN v_deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Create materialized view for daily activity statistics
CREATE MATERIALIZED VIEW daily_activity_statistics AS
SELECT 
    DATE(activity_date) AS activity_day,
    activity_type,
    COUNT(*) AS total_activities,
    COUNT(DISTINCT user_id) AS unique_users,
    COUNT(*) FILTER (WHERE success = TRUE) AS successful_activities,
    COUNT(*) FILTER (WHERE success = FALSE) AS failed_activities,
    AVG(duration_ms) AS avg_duration_ms,
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY duration_ms) AS median_duration_ms,
    PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY duration_ms) AS p95_duration_ms
FROM user_activity
WHERE activity_date >= CURRENT_DATE - INTERVAL '90 days'
GROUP BY DATE(activity_date), activity_type;

-- Create index on materialized view
CREATE INDEX idx_daily_activity_statistics_day ON daily_activity_statistics(activity_day DESC);
CREATE INDEX idx_daily_activity_statistics_type ON daily_activity_statistics(activity_type);

-- Create function to refresh materialized view
CREATE OR REPLACE FUNCTION refresh_daily_activity_statistics()
RETURNS VOID AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY daily_activity_statistics;
END;
$$ LANGUAGE plpgsql;

-- Add comments
COMMENT ON TABLE user_activity IS 'Comprehensive user activity tracking for audit and analytics';
COMMENT ON COLUMN user_activity.activity_id IS 'Unique identifier for the activity';
COMMENT ON COLUMN user_activity.user_id IS 'User who performed the activity';
COMMENT ON COLUMN user_activity.activity_type IS 'Type of activity performed';
COMMENT ON COLUMN user_activity.target_id IS 'ID of the entity the activity was performed on';
COMMENT ON COLUMN user_activity.target_type IS 'Type of entity (concept, graph, thesis, etc.)';
COMMENT ON COLUMN user_activity.details IS 'Additional JSON details about the activity';
COMMENT ON COLUMN user_activity.duration_ms IS 'Duration of the activity in milliseconds';
COMMENT ON COLUMN user_activity.success IS 'Whether the activity completed successfully';
COMMENT ON FUNCTION log_user_activity IS 'Helper function to log user activities';
COMMENT ON FUNCTION get_user_activity_summary IS 'Get summary statistics of user activities';
COMMENT ON FUNCTION get_concept_view_stats IS 'Get viewing statistics for a specific concept';
COMMENT ON FUNCTION cleanup_old_activity_logs IS 'Remove activity logs older than retention period';
COMMENT ON MATERIALIZED VIEW daily_activity_statistics IS 'Pre-aggregated daily activity statistics';