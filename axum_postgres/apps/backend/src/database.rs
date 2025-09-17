use sqlx::{postgres::PgPoolOptions, PgPool};
use std::env;

/// Create PostgreSQL connection pool
/// 
/// # Arguments
/// * `database_url` - PostgreSQL connection string
/// 
/// # Returns
/// * `Result<PgPool, sqlx::Error>` - Connection pool or error
pub async fn create_pool(database_url: &str) -> Result<PgPool, sqlx::Error> {
    PgPoolOptions::new()
        .max_connections(10)
        .connect(database_url)
        .await
}

/// Create database pool from environment variables
/// 
/// Reads DATABASE_URL from environment or constructs from individual variables
pub async fn create_pool_from_env() -> Result<PgPool, sqlx::Error> {
    let database_url = get_database_url();
    create_pool(&database_url).await
}

/// Get database URL from environment variables
/// 
/// Priority:
/// 1. DATABASE_URL (full connection string)
/// 2. Individual variables (DB_HOST, DB_PORT, etc.)
pub fn get_database_url() -> String {
    if let Ok(database_url) = env::var("DATABASE_URL") {
        return database_url;
    }

    // Construct from individual variables
    let host = env::var("DB_HOST").unwrap_or_else(|_| "localhost".to_string());
    let port = env::var("DB_PORT").unwrap_or_else(|_| "5435".to_string());
    let user = env::var("DB_USER").unwrap_or_else(|_| "postgres".to_string());
    let password = env::var("DB_PASSWORD").unwrap_or_else(|_| "password".to_string());
    let database = env::var("DB_NAME").unwrap_or_else(|_| "dev".to_string());

    format!("postgresql://{}:{}@{}:{}/{}", user, password, host, port, database)
}

/// Test database connection
/// 
/// Performs a simple query to verify database connectivity
pub async fn test_connection(pool: &PgPool) -> Result<(), sqlx::Error> {
    sqlx::query("SELECT 1")
        .execute(pool)
        .await
        .map(|_| ())
}