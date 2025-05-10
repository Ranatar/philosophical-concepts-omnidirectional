-- Migration: Create users table
-- Description: Creates the users table to store user account information

-- Begin transaction
BEGIN;

-- Create enum for user status
CREATE TYPE user_status AS ENUM (
  'active',
  'inactive',
  'suspended',
  'deleted'
);

-- Create enum for user roles
CREATE TYPE user_role AS ENUM (
  'admin',
  'moderator',
  'user',
  'guest'
);

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  status user_status NOT NULL DEFAULT 'active',
  role user_role NOT NULL DEFAULT 'user',
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  last_login TIMESTAMP WITH TIME ZONE
);

-- Create indexes for performance
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_role ON users(role);

-- Add table comments
COMMENT ON TABLE users IS 'Stores user account information for the philosophy service';
COMMENT ON COLUMN users.user_id IS 'Unique identifier for the user';
COMMENT ON COLUMN users.username IS 'Unique username for the user';
COMMENT ON COLUMN users.email IS 'Unique email address for the user';
COMMENT ON COLUMN users.password_hash IS 'Hashed password for the user';
COMMENT ON COLUMN users.first_name IS 'First name of the user';
COMMENT ON COLUMN users.last_name IS 'Last name of the user';
COMMENT ON COLUMN users.status IS 'Current status of the user account';
COMMENT ON COLUMN users.role IS 'Role for the user, determining permissions';
COMMENT ON COLUMN users.settings IS 'User preferences and settings as JSON';
COMMENT ON COLUMN users.created_at IS 'Timestamp when the user account was created';
COMMENT ON COLUMN users.updated_at IS 'Timestamp when the user account was last updated';
COMMENT ON COLUMN users.last_login IS 'Timestamp of the user''s last login';

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to automatically update the updated_at column
CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Commit transaction
COMMIT;
