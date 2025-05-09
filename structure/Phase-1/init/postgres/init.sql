-- Initialize the PostgreSQL database for development
-- This script is executed when the container is first created

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Set timezone
SET timezone = 'UTC';

-- Create schemas
CREATE SCHEMA IF NOT EXISTS philosophy;
CREATE SCHEMA IF NOT EXISTS auth;

-- Set default schema
SET search_path TO philosophy, auth, public;

-- Notify that initialization is complete
DO $$
BEGIN
    RAISE NOTICE 'PostgreSQL initialization completed successfully';
END $$;
