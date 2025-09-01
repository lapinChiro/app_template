-- Create test_users table
CREATE TABLE IF NOT EXISTS test_users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_test_users_email ON test_users(email);

-- Insert test data
INSERT INTO test_users (name, email, active) VALUES
    ('Alice Johnson', 'alice@example.com', true),
    ('Bob Smith', 'bob@example.com', true),
    ('Charlie Brown', 'charlie@example.com', false);