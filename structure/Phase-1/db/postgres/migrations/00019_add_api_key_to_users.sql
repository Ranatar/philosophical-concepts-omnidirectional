-- Migration: 00019_add_api_key_to_users
-- Created at: 2024-01-01
-- Description: Add API key management fields to users table (if not already present)

-- This migration is for existing databases where the users table was created without API key support
-- It safely adds the columns only if they don't already exist

-- Add claude_api_key_encrypted column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'claude_api_key_encrypted'
    ) THEN
        ALTER TABLE users ADD COLUMN claude_api_key_encrypted TEXT;
        COMMENT ON COLUMN users.claude_api_key_encrypted IS 'Encrypted Claude API key (AES-256)';
    END IF;
END $$;

-- Add use_own_api_key column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'use_own_api_key'
    ) THEN
        ALTER TABLE users ADD COLUMN use_own_api_key BOOLEAN DEFAULT FALSE;
        COMMENT ON COLUMN users.use_own_api_key IS 'Whether user prefers to use their own API key';
    END IF;
END $$;

-- Add api_key_added_at column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'api_key_added_at'
    ) THEN
        ALTER TABLE users ADD COLUMN api_key_added_at TIMESTAMP WITH TIME ZONE;
        COMMENT ON COLUMN users.api_key_added_at IS 'Timestamp when API key was added';
    END IF;
END $$;

-- Add api_key_last_used column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'api_key_last_used'
    ) THEN
        ALTER TABLE users ADD COLUMN api_key_last_used TIMESTAMP WITH TIME ZONE;
        COMMENT ON COLUMN users.api_key_last_used IS 'Timestamp of last API key usage';
    END IF;
END $$;

-- Create index for users with API keys if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_indexes
        WHERE tablename = 'users'
        AND indexname = 'idx_users_api_key_exists'
    ) THEN
        CREATE INDEX idx_users_api_key_exists ON users(user_id) 
        WHERE claude_api_key_encrypted IS NOT NULL;
    END IF;
END $$;

-- Create function to update api_key_last_used timestamp
CREATE OR REPLACE FUNCTION update_api_key_last_used(
    p_user_id UUID
)
RETURNS VOID AS $$
BEGIN
    UPDATE users
    SET api_key_last_used = CURRENT_TIMESTAMP
    WHERE user_id = p_user_id
    AND claude_api_key_encrypted IS NOT NULL;
END;
$$ LANGUAGE plpgsql;

-- Create function to set user API key (with encryption)
CREATE OR REPLACE FUNCTION set_user_api_key(
    p_user_id UUID,
    p_encrypted_key TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    v_success BOOLEAN := FALSE;
BEGIN
    UPDATE users
    SET 
        claude_api_key_encrypted = p_encrypted_key,
        api_key_added_at = CURRENT_TIMESTAMP,
        use_own_api_key = TRUE
    WHERE user_id = p_user_id;
    
    GET DIAGNOSTICS v_success = ROW_COUNT > 0;
    
    RETURN v_success;
END;
$$ LANGUAGE plpgsql;

-- Create function to remove user API key
CREATE OR REPLACE FUNCTION remove_user_api_key(
    p_user_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
    v_success BOOLEAN := FALSE;
BEGIN
    UPDATE users
    SET 
        claude_api_key_encrypted = NULL,
        api_key_added_at = NULL,
        api_key_last_used = NULL,
        use_own_api_key = FALSE
    WHERE user_id = p_user_id;
    
    GET DIAGNOSTICS v_success = ROW_COUNT > 0;
    
    -- Log the removal
    PERFORM log_user_activity(
        p_user_id,
        'api_key_removed'::activity_type_enum,
        NULL,
        NULL,
        '{"action": "api_key_removed"}'::jsonb
    );
    
    RETURN v_success;
END;
$$ LANGUAGE plpgsql;

-- Create function to get users with API keys
CREATE OR REPLACE FUNCTION get_users_with_api_keys(
    p_limit INTEGER DEFAULT 100,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE(
    user_id UUID,
    username VARCHAR(50),
    email VARCHAR(255),
    api_key_added_at TIMESTAMP WITH TIME ZONE,
    api_key_last_used TIMESTAMP WITH TIME ZONE,
    days_since_last_use INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.user_id,
        u.username,
        u.email,
        u.api_key_added_at,
        u.api_key_last_used,
        CASE 
            WHEN u.api_key_last_used IS NOT NULL 
            THEN EXTRACT(DAY FROM CURRENT_TIMESTAMP - u.api_key_last_used)::INTEGER
            ELSE NULL
        END AS days_since_last_use
    FROM users u
    WHERE u.claude_api_key_encrypted IS NOT NULL
    AND u.deleted_at IS NULL
    ORDER BY u.api_key_last_used DESC NULLS LAST
    LIMIT p_limit
    OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;

-- Create function to check if user has valid API key
CREATE OR REPLACE FUNCTION user_has_api_key(
    p_user_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
    v_has_key BOOLEAN;
BEGIN
    SELECT claude_api_key_encrypted IS NOT NULL AND use_own_api_key = TRUE
    INTO v_has_key
    FROM users
    WHERE user_id = p_user_id
    AND deleted_at IS NULL;
    
    RETURN COALESCE(v_has_key, FALSE);
END;
$$ LANGUAGE plpgsql;

-- Create view for API key usage statistics
CREATE OR REPLACE VIEW user_api_key_statistics AS
SELECT 
    COUNT(*) FILTER (WHERE claude_api_key_encrypted IS NOT NULL) AS users_with_keys,
    COUNT(*) FILTER (WHERE claude_api_key_encrypted IS NULL) AS users_without_keys,
    COUNT(*) FILTER (WHERE use_own_api_key = TRUE) AS users_using_own_key,
    COUNT(*) FILTER (WHERE api_key_last_used >= CURRENT_DATE - INTERVAL '7 days') AS active_last_week,
    COUNT(*) FILTER (WHERE api_key_last_used >= CURRENT_DATE - INTERVAL '30 days') AS active_last_month,
    COUNT(*) FILTER (
        WHERE claude_api_key_encrypted IS NOT NULL 
        AND api_key_last_used IS NULL
    ) AS keys_never_used,
    AVG(
        CASE 
            WHEN api_key_last_used IS NOT NULL 
            THEN EXTRACT(DAY FROM CURRENT_TIMESTAMP - api_key_last_used)
            ELSE NULL
        END
    )::NUMERIC(10,2) AS avg_days_since_last_use
FROM users
WHERE deleted_at IS NULL;

-- Create function to migrate existing API keys if needed
-- This is a placeholder for actual migration logic
CREATE OR REPLACE FUNCTION migrate_existing_api_keys()
RETURNS TABLE(
    migrated_count INTEGER,
    failed_count INTEGER
) AS $$
DECLARE
    v_migrated INTEGER := 0;
    v_failed INTEGER := 0;
BEGIN
    -- This function would contain logic to migrate API keys from an old schema
    -- For now, it just returns zeros as there's nothing to migrate
    
    RETURN QUERY SELECT v_migrated, v_failed;
END;
$$ LANGUAGE plpgsql;

-- Add comments for new functions
COMMENT ON FUNCTION update_api_key_last_used IS 'Update the last used timestamp for a user''s API key';
COMMENT ON FUNCTION set_user_api_key IS 'Set encrypted API key for a user';
COMMENT ON FUNCTION remove_user_api_key IS 'Remove API key for a user';
COMMENT ON FUNCTION get_users_with_api_keys IS 'Get list of users who have API keys';
COMMENT ON FUNCTION user_has_api_key IS 'Check if user has a valid API key';
COMMENT ON VIEW user_api_key_statistics IS 'Statistics about API key usage across all users';

-- Grant appropriate permissions (adjust based on your role structure)
-- GRANT EXECUTE ON FUNCTION set_user_api_key TO api_user_role;
-- GRANT EXECUTE ON FUNCTION remove_user_api_key TO api_user_role;
-- GRANT EXECUTE ON FUNCTION user_has_api_key TO api_user_role;
-- GRANT SELECT ON user_api_key_statistics TO api_readonly_role;