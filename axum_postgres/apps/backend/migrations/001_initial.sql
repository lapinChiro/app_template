-- Initial migration for axum_postgres
-- Based on hono_postgres schema analysis

-- Create test_users table
CREATE TABLE IF NOT EXISTS test_users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_test_users_email ON test_users(email);

-- Create index on active status for filtering
CREATE INDEX IF NOT EXISTS idx_test_users_active ON test_users(active);

-- Create index on created_at for ordering
CREATE INDEX IF NOT EXISTS idx_test_users_created_at ON test_users(created_at DESC);

-- Insert test data
INSERT INTO test_users (name, email, active) VALUES
    ('Alice Johnson', 'alice@example.com', true),
    ('Bob Smith', 'bob@example.com', true),
    ('Charlie Brown', 'charlie@example.com', false)
ON CONFLICT (email) DO NOTHING;