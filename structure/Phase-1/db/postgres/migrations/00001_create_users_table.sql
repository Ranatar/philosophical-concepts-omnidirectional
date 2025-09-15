-- Migration: 00001_create_users_table
-- Created at: 2024-01-01
-- Description: Create users table with authentication and API key management

-- Create UUID extension if not exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    -- Primary key
    user_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Basic user information
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    
    -- User profile
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    avatar_url VARCHAR(500),
    bio TEXT,
    
    -- API key management
    claude_api_key_encrypted TEXT,
    use_own_api_key BOOLEAN DEFAULT FALSE,
    api_key_added_at TIMESTAMP WITH TIME ZONE,
    api_key_last_used TIMESTAMP WITH TIME ZONE,
    
    -- Account status
    is_active BOOLEAN DEFAULT TRUE,
    is_verified BOOLEAN DEFAULT FALSE,
    verification_token VARCHAR(255),
    verification_token_expires_at TIMESTAMP WITH TIME ZONE,
    
    -- Password reset
    reset_password_token VARCHAR(255),
    reset_password_expires_at TIMESTAMP WITH TIME ZONE,
    
    -- User settings (JSONB for flexibility)
    user_settings JSONB DEFAULT '{}',
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP WITH TIME ZONE,
    
    -- Soft delete
    deleted_at TIMESTAMP WITH TIME ZONE,
    
    -- Constraints
    CONSTRAINT chk_email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    CONSTRAINT chk_username_format CHECK (username ~* '^[a-zA-Z0-9_-]{3,50}$')
);

-- Create indexes for better query performance
CREATE INDEX idx_users_email ON users(email) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_username ON users(username) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_created_at ON users(created_at);
CREATE INDEX idx_users_last_login ON users(last_login);
CREATE INDEX idx_users_verification_token ON users(verification_token) WHERE verification_token IS NOT NULL;
CREATE INDEX idx_users_reset_password_token ON users(reset_password_token) WHERE reset_password_token IS NOT NULL;
CREATE INDEX idx_users_api_key_exists ON users(user_id) WHERE claude_api_key_encrypted IS NOT NULL;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create function to validate user settings JSON
CREATE OR REPLACE FUNCTION validate_user_settings()
RETURNS TRIGGER AS $$
BEGIN
    -- Ensure user_settings is an object
    IF jsonb_typeof(NEW.user_settings) != 'object' THEN
        RAISE EXCEPTION 'user_settings must be a JSON object';
    END IF;
    
    -- Add any specific validation rules for settings here
    -- Example: Check for allowed keys, data types, etc.
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to validate user settings
CREATE TRIGGER validate_users_settings
    BEFORE INSERT OR UPDATE ON users
    FOR EACH ROW
    WHEN (NEW.user_settings IS NOT NULL)
    EXECUTE FUNCTION validate_user_settings();

-- Add comments for documentation
COMMENT ON TABLE users IS 'Main users table storing authentication and profile information';
COMMENT ON COLUMN users.user_id IS 'Unique identifier for the user';
COMMENT ON COLUMN users.username IS 'Unique username for login and display';
COMMENT ON COLUMN users.email IS 'User email address for authentication and communication';
COMMENT ON COLUMN users.password_hash IS 'Bcrypt hashed password';
COMMENT ON COLUMN users.claude_api_key_encrypted IS 'Encrypted Claude API key (AES-256)';
COMMENT ON COLUMN users.use_own_api_key IS 'Whether user prefers to use their own API key';
COMMENT ON COLUMN users.api_key_added_at IS 'Timestamp when API key was added';
COMMENT ON COLUMN users.api_key_last_used IS 'Timestamp of last API key usage';
COMMENT ON COLUMN users.user_settings IS 'JSON object containing user preferences and settings';
COMMENT ON COLUMN users.is_active IS 'Whether the account is active';
COMMENT ON COLUMN users.is_verified IS 'Whether the email has been verified';
COMMENT ON COLUMN users.deleted_at IS 'Soft delete timestamp';

-- Create initial admin user (password: admin123 - should be changed immediately)
-- Note: In production, this should be handled by a seed script with environment variables
INSERT INTO users (
    username,
    email,
    password_hash,
    first_name,
    last_name,
    is_active,
    is_verified,
    user_settings
) VALUES (
    'admin',
    'admin@philosophy-concepts.com',
    '$2b$10$YourHashedPasswordHere', -- Replace with actual bcrypt hash
    'System',
    'Administrator',
    true,
    true,
    '{"role": "admin", "notifications": {"email": true, "inApp": true}}'::jsonb
) ON CONFLICT (username) DO NOTHING;