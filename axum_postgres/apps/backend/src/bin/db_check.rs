// Database connection test binary
use backend::database::{create_pool_from_env, get_database_url, test_connection};
use dotenvy::dotenv;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Load environment variables from .env file
    dotenv().ok();

    println!("=== Database Connection Test ===");
    
    let database_url = get_database_url();
    println!("Database URL: {}", mask_password(&database_url));

    println!("Creating connection pool...");
    let pool = create_pool_from_env().await?;
    
    println!("✅ Connection pool created successfully");

    println!("Testing database connection...");
    test_connection(&pool).await?;
    
    println!("✅ Database connection test successful");

    // Test basic query
    println!("Running basic query...");
    let result: (i32,) = sqlx::query_as("SELECT 1 as test")
        .fetch_one(&pool)
        .await?;
    
    println!("✅ Basic query result: {}", result.0);

    // Check if test_users table exists
    println!("Checking test_users table...");
    let table_exists: (bool,) = sqlx::query_as(
        "SELECT EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_name = 'test_users'
        )"
    )
    .fetch_one(&pool)
    .await?;

    if table_exists.0 {
        println!("✅ test_users table exists");
        
        // Count rows in test_users
        let count: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM test_users")
            .fetch_one(&pool)
            .await?;
        
        println!("✅ test_users table has {} rows", count.0);
    } else {
        println!("⚠️  test_users table does not exist");
        println!("   Run migrations with: sqlx migrate run");
    }

    pool.close().await;
    println!("✅ Database connection test completed successfully");

    Ok(())
}

/// Mask password in database URL for safe logging
fn mask_password(url: &str) -> String {
    if let Some(start) = url.find("://") {
        if let Some(at_pos) = url.find('@') {
            if let Some(colon_pos) = url[start + 3..at_pos].find(':') {
                let mut masked = url.to_string();
                let password_start = start + 3 + colon_pos + 1;
                let password_end = at_pos;
                masked.replace_range(password_start..password_end, "****");
                return masked;
            }
        }
    }
    url.to_string()
}