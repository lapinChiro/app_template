-- =============================================
-- axum_postgres Database Schema
-- =============================================
-- Source: hono_postgres existing implementation
-- Generated: 2025-09-03
-- Target: PostgreSQL 17+

-- =============================================
-- 1. Database Creation (for reference)
-- =============================================
-- CREATE DATABASE dev;
-- \c dev;

-- =============================================
-- 2. Main Tables
-- =============================================

-- Users table for project management system
CREATE TABLE IF NOT EXISTS test_users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- =============================================
-- 3. Indexes for Performance
-- =============================================

-- Email lookup optimization (used for uniqueness check)
CREATE INDEX IF NOT EXISTS idx_test_users_email ON test_users(email);

-- Active users filtering
CREATE INDEX IF NOT EXISTS idx_test_users_active ON test_users(active);

-- Created date sorting (for pagination)
CREATE INDEX IF NOT EXISTS idx_test_users_created_at ON test_users(created_at DESC);

-- =============================================
-- 4. Initial Test Data
-- =============================================

INSERT INTO test_users (name, email, active) VALUES
    ('Alice Johnson', 'alice@example.com', true),
    ('Bob Smith', 'bob@example.com', true), 
    ('Charlie Brown', 'charlie@example.com', false)
ON CONFLICT (email) DO NOTHING;

-- =============================================
-- 5. Verification Queries
-- =============================================

-- Verify table structure
-- SELECT 
--     column_name, 
--     data_type, 
--     is_nullable, 
--     column_default
-- FROM information_schema.columns 
-- WHERE table_name = 'test_users' 
-- ORDER BY ordinal_position;

-- Verify indexes
-- SELECT indexname, indexdef 
-- FROM pg_indexes 
-- WHERE tablename = 'test_users';

-- Verify initial data
-- SELECT COUNT(*) as total_users FROM test_users;
-- SELECT COUNT(*) as active_users FROM test_users WHERE active = true;

-- =============================================
-- 6. Migration Notes for Axum Implementation
-- =============================================

-- For sqlx migrations:
-- 1. Create migration file: migrations/001_initial.sql
-- 2. Run: sqlx migrate run
-- 3. Generate offline query data: cargo sqlx prepare

-- Expected sqlx query patterns:
-- sqlx::query_as!(
--     User,
--     "SELECT id, name, email, active, created_at FROM test_users WHERE id = $1",
--     user_id
-- )

-- =============================================
-- 7. Table Statistics and Constraints
-- =============================================

-- Table: test_users
-- Estimated size: Small (< 10K records expected)
-- Primary key: id (SERIAL - auto-increment integer)
-- Unique constraints: email
-- Non-null constraints: name, email, active, created_at
-- Default values: active = true, created_at = NOW()

-- Performance considerations:
-- - id: Primary key automatically indexed
-- - email: UNIQUE constraint creates automatic index  
-- - Additional indexes on active and created_at for common queries

-- =============================================
-- 8. Expected Query Patterns
-- =============================================

-- Most frequent queries (implement these efficiently):
-- 1. SELECT by id (get single user)
-- 2. SELECT all ORDER BY created_at DESC (list users)
-- 3. INSERT new user (create)
-- 4. UPDATE by id (modify user)
-- 5. DELETE by id (remove user)
-- 6. SELECT WHERE active = true (active users only)

-- =============================================
-- 9. Future Schema Extensions
-- =============================================

-- Potential additions for project management:
-- - projects table
-- - project_members (many-to-many with users)
-- - tasks table  
-- - task_assignments
-- - roles and permissions

-- Current schema is minimal MVP focused on user management
-- Extensions should maintain backward compatibility