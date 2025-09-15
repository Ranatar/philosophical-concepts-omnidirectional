-- Migration: 00020_create_shared_api_keys_table
-- Created at: 2024-01-01
-- Description: Create table for sharing API keys between users

-- Create enum for sharing permissions
CREATE TYPE api_key_permission AS ENUM (
    'read_only',      -- Can only use for reading/analysis
    'full_access',    -- Can use for all operations
    'limited_daily',  -- Limited number of requests per day
    'project_specific' -- Limited to specific projects/concepts
);

-- Create shared_api_keys table
CREATE TABLE IF NOT EXISTS shared_api_keys (
    -- Primary key
    share_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Foreign keys
    owner_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    shared_with_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    
    -- Sharing details
    shared_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE,
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    revoked_at TIMESTAMP WITH TIME ZONE,
    revoke_reason TEXT,
    
    -- Permissions and limits
    permissions JSONB NOT NULL DEFAULT '{"permission_type": "read_only"}',
    
    -- Usage limits
    daily_limit INTEGER, -- Max requests per day (NULL = unlimited)
    total_limit INTEGER, -- Max total requests (NULL = unlimited)
    
    -- Usage tracking
    total_uses INTEGER DEFAULT 0,
    last_used_at TIMESTAMP WITH TIME ZONE,
    
    -- Scope restrictions
    allowed_operations TEXT[], -- Specific operations allowed (NULL = all)
    allowed_concepts UUID[], -- Specific concept IDs (NULL = all)
    
    -- Sharing metadata
    share_note TEXT, -- Note from owner to recipient
    share_token VARCHAR(255) UNIQUE, -- Optional token for sharing via link
    
    -- Acceptance
    accepted_at TIMESTAMP WITH TIME ZONE,
    declined_at TIMESTAMP WITH TIME ZONE,
    decline_reason TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    UNIQUE(owner_id, shared_with_id), -- One active share per user pair
    CONSTRAINT chk_not_self_share CHECK (owner_id != shared_with_id),
    CONSTRAINT chk_permissions_format CHECK (jsonb_typeof(permissions) = 'object'),
    CONSTRAINT chk_expiry_future CHECK (expires_at IS NULL OR expires_at > shared_at),
    CONSTRAINT chk_limits_positive CHECK (
        (daily_limit IS NULL OR daily_limit > 0) AND
        (total_limit IS NULL OR total_limit > 0)
    ),
    CONSTRAINT chk_status_consistency CHECK (
        (is_active = FALSE AND revoked_at IS NOT NULL) OR
        (is_active = TRUE AND revoked_at IS NULL)
    )
);

-- Create indexes
CREATE INDEX idx_shared_api_keys_owner ON shared_api_keys(owner_id) WHERE is_active = TRUE;
CREATE INDEX idx_shared_api_keys_recipient ON shared_api_keys(shared_with_id) WHERE is_active = TRUE;
CREATE INDEX idx_shared_api_keys_expires ON shared_api_keys(expires_at) WHERE is_active = TRUE AND expires_at IS NOT NULL;
CREATE INDEX idx_shared_api_keys_token ON shared_api_keys(share_token) WHERE share_token IS NOT NULL;
CREATE INDEX idx_shared_api_keys_accepted ON shared_api_keys(accepted_at) WHERE accepted_at IS NOT NULL;
CREATE INDEX idx_shared_api_keys_concepts ON shared_api_keys USING GIN(allowed_concepts) WHERE allowed_concepts IS NOT NULL;

-- Create trigger to update updated_at
CREATE TRIGGER update_shared_api_keys_updated_at 
    BEFORE UPDATE ON shared_api_keys
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create function to create API key share
CREATE OR REPLACE FUNCTION create_api_key_share(
    p_owner_id UUID,
    p_shared_with_id UUID,
    p_permissions JSONB DEFAULT '{"permission_type": "read_only"}'::jsonb,
    p_expires_in_days INTEGER DEFAULT NULL,
    p_daily_limit INTEGER DEFAULT NULL,
    p_allowed_operations TEXT[] DEFAULT NULL,
    p_share_note TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_share_id UUID;
    v_owner_has_key BOOLEAN;
BEGIN
    -- Check if owner has an API key
    SELECT user_has_api_key(p_owner_id) INTO v_owner_has_key;
    
    IF NOT v_owner_has_key THEN
        RAISE EXCEPTION 'Owner does not have an API key to share';
    END IF;
    
    -- Check if users are different
    IF p_owner_id = p_shared_with_id THEN
        RAISE EXCEPTION 'Cannot share API key with yourself';
    END IF;
    
    -- Deactivate any existing share between these users
    UPDATE shared_api_keys
    SET is_active = FALSE,
        revoked_at = CURRENT_TIMESTAMP,
        revoke_reason = 'Replaced by new share'
    WHERE owner_id = p_owner_id 
    AND shared_with_id = p_shared_with_id
    AND is_active = TRUE;
    
    -- Create new share
    INSERT INTO shared_api_keys (
        owner_id,
        shared_with_id,
        permissions,
        expires_at,
        daily_limit,
        allowed_operations,
        share_note,
        share_token
    ) VALUES (
        p_owner_id,
        p_shared_with_id,
        p_permissions,
        CASE 
            WHEN p_expires_in_days IS NOT NULL 
            THEN CURRENT_TIMESTAMP + (p_expires_in_days || ' days')::INTERVAL
            ELSE NULL
        END,
        p_daily_limit,
        p_allowed_operations,
        p_share_note,
        encode(gen_random_bytes(32), 'hex') -- Generate secure token
    ) RETURNING share_id INTO v_share_id;
    
    -- Log activity
    PERFORM log_user_activity(
        p_owner_id,
        'api_key_shared'::activity_type_enum,
        v_share_id,
        'shared_api_key',
        jsonb_build_object(
            'shared_with_id', p_shared_with_id,
            'permissions', p_permissions
        )
    );
    
    RETURN v_share_id;
END;
$$ LANGUAGE plpgsql;

-- Create function to accept API key share
CREATE OR REPLACE FUNCTION accept_api_key_share(
    p_share_id UUID,
    p_user_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
    v_success BOOLEAN := FALSE;
BEGIN
    UPDATE shared_api_keys
    SET accepted_at = CURRENT_TIMESTAMP
    WHERE share_id = p_share_id
    AND shared_with_id = p_user_id
    AND is_active = TRUE
    AND accepted_at IS NULL
    AND declined_at IS NULL;
    
    GET DIAGNOSTICS v_success = ROW_COUNT > 0;
    
    IF v_success THEN
        -- Log activity
        PERFORM log_user_activity(
            p_user_id,
            'api_key_shared'::activity_type_enum,
            p_share_id,
            'shared_api_key',
            '{"action": "accepted"}'::jsonb
        );
    END IF;
    
    RETURN v_success;
END;
$$ LANGUAGE plpgsql;

-- Create function to revoke API key share
CREATE OR REPLACE FUNCTION revoke_api_key_share(
    p_share_id UUID,
    p_user_id UUID,
    p_reason TEXT DEFAULT 'Revoked by owner'
)
RETURNS BOOLEAN AS $$
DECLARE
    v_success BOOLEAN := FALSE;
    v_owner_id UUID;
    v_shared_with_id UUID;
BEGIN
    -- Get share details
    SELECT owner_id, shared_with_id 
    INTO v_owner_id, v_shared_with_id
    FROM shared_api_keys
    WHERE share_id = p_share_id;
    
    -- Check if user is authorized to revoke (owner or recipient)
    IF p_user_id NOT IN (v_owner_id, v_shared_with_id) THEN
        RAISE EXCEPTION 'Unauthorized to revoke this share';
    END IF;
    
    -- Revoke the share
    UPDATE shared_api_keys
    SET 
        is_active = FALSE,
        revoked_at = CURRENT_TIMESTAMP,
        revoke_reason = p_reason
    WHERE share_id = p_share_id
    AND is_active = TRUE;
    
    GET DIAGNOSTICS v_success = ROW_COUNT > 0;
    
    RETURN v_success;
END;
$$ LANGUAGE plpgsql;

-- Create function to track shared key usage
CREATE OR REPLACE FUNCTION track_shared_key_usage(
    p_share_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
    v_daily_uses INTEGER;
    v_daily_limit INTEGER;
    v_total_uses INTEGER;
    v_total_limit INTEGER;
    v_last_reset DATE;
BEGIN
    -- Get current usage and limits
    SELECT 
        total_uses,
        daily_limit,
        total_limit,
        DATE(last_used_at)
    INTO 
        v_total_uses,
        v_daily_limit,
        v_total_limit,
        v_last_reset
    FROM shared_api_keys
    WHERE share_id = p_share_id
    AND is_active = TRUE
    AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP);
    
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;
    
    -- Check total limit
    IF v_total_limit IS NOT NULL AND v_total_uses >= v_total_limit THEN
        RETURN FALSE;
    END IF;
    
    -- Check daily limit
    IF v_daily_limit IS NOT NULL THEN
        -- Count today's uses
        SELECT COUNT(*)
        INTO v_daily_uses
        FROM api_key_usage
        WHERE share_id = p_share_id
        AND DATE(usage_date) = CURRENT_DATE;
        
        IF v_daily_uses >= v_daily_limit THEN
            RETURN FALSE;
        END IF;
    END IF;
    
    -- Update usage
    UPDATE shared_api_keys
    SET 
        total_uses = total_uses + 1,
        last_used_at = CURRENT_TIMESTAMP
    WHERE share_id = p_share_id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Create function to get available shared keys for user
CREATE OR REPLACE FUNCTION get_available_shared_keys(
    p_user_id UUID
)
RETURNS TABLE(
    share_id UUID,
    owner_id UUID,
    owner_username VARCHAR(50),
    owner_email VARCHAR(255),
    permissions JSONB,
    daily_limit INTEGER,
    total_limit INTEGER,
    total_uses INTEGER,
    expires_at TIMESTAMP WITH TIME ZONE,
    allowed_operations TEXT[],
    share_note TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        sak.share_id,
        sak.owner_id,
        u.username AS owner_username,
        u.email AS owner_email,
        sak.permissions,
        sak.daily_limit,
        sak.total_limit,
        sak.total_uses,
        sak.expires_at,
        sak.allowed_operations,
        sak.share_note
    FROM shared_api_keys sak
    JOIN users u ON sak.owner_id = u.user_id
    WHERE sak.shared_with_id = p_user_id
    AND sak.is_active = TRUE
    AND sak.accepted_at IS NOT NULL
    AND (sak.expires_at IS NULL OR sak.expires_at > CURRENT_TIMESTAMP)
    AND u.claude_api_key_encrypted IS NOT NULL
    ORDER BY sak.accepted_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Create view for share statistics
CREATE OR REPLACE VIEW api_key_share_statistics AS
SELECT 
    owner_id,
    COUNT(*) AS total_shares,
    COUNT(*) FILTER (WHERE is_active = TRUE) AS active_shares,
    COUNT(*) FILTER (WHERE accepted_at IS NOT NULL) AS accepted_shares,
    COUNT(*) FILTER (WHERE declined_at IS NOT NULL) AS declined_shares,
    COUNT(DISTINCT shared_with_id) AS unique_recipients,
    SUM(total_uses) AS total_usage_count,
    MAX(last_used_at) AS most_recent_use
FROM shared_api_keys
GROUP BY owner_id;

-- Create function to check if user can use shared key
CREATE OR REPLACE FUNCTION can_use_shared_key(
    p_share_id UUID,
    p_user_id UUID,
    p_operation TEXT DEFAULT NULL,
    p_concept_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    v_share shared_api_keys%ROWTYPE;
BEGIN
    -- Get share details
    SELECT * INTO v_share
    FROM shared_api_keys
    WHERE share_id = p_share_id
    AND shared_with_id = p_user_id
    AND is_active = TRUE
    AND accepted_at IS NOT NULL
    AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP);
    
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;
    
    -- Check operation restrictions
    IF p_operation IS NOT NULL AND 
       v_share.allowed_operations IS NOT NULL AND
       NOT (p_operation = ANY(v_share.allowed_operations)) THEN
        RETURN FALSE;
    END IF;
    
    -- Check concept restrictions
    IF p_concept_id IS NOT NULL AND 
       v_share.allowed_concepts IS NOT NULL AND
       NOT (p_concept_id = ANY(v_share.allowed_concepts)) THEN
        RETURN FALSE;
    END IF;
    
    -- Check usage limits
    RETURN track_shared_key_usage(p_share_id);
END;
$$ LANGUAGE plpgsql;

-- Add comments
COMMENT ON TABLE shared_api_keys IS 'Tracks API key sharing between users';
COMMENT ON COLUMN shared_api_keys.share_id IS 'Unique identifier for the share';
COMMENT ON COLUMN shared_api_keys.owner_id IS 'User who owns and shares the API key';
COMMENT ON COLUMN shared_api_keys.shared_with_id IS 'User who receives access to the API key';
COMMENT ON COLUMN shared_api_keys.permissions IS 'JSON object defining permission details';
COMMENT ON COLUMN shared_api_keys.daily_limit IS 'Maximum requests per day (NULL = unlimited)';
COMMENT ON COLUMN shared_api_keys.allowed_operations IS 'Specific operations allowed (NULL = all)';
COMMENT ON COLUMN shared_api_keys.share_token IS 'Token for sharing via link';
COMMENT ON FUNCTION create_api_key_share IS 'Create a new API key share';
COMMENT ON FUNCTION accept_api_key_share IS 'Accept a shared API key';
COMMENT ON FUNCTION revoke_api_key_share IS 'Revoke an API key share';
COMMENT ON FUNCTION get_available_shared_keys IS 'Get all available shared keys for a user';
COMMENT ON FUNCTION can_use_shared_key IS 'Check if user can use a shared key for specific operation';
COMMENT ON VIEW api_key_share_statistics IS 'Statistics about API key sharing';