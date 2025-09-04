// User database operations test binary
use backend::database::create_pool_from_env;
use backend::models::user::{CreateUserRequest, UpdateUserRequest};
use backend::repository::user::{UserRepository, UserRepositoryTrait};
use dotenvy::dotenv;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    dotenv().ok();

    println!("=== User Database Operations Test ===");

    // Create database pool
    println!("1. Creating database connection pool...");
    let pool = create_pool_from_env().await?;
    println!("✅ Database pool created successfully");

    let repo = UserRepository::new(pool);

    // Test create user
    println!("\n2. Testing user creation...");
    let create_request = CreateUserRequest {
        name: "Operations Test User".to_string(),
        email: "operations_test@example.com".to_string(),
    };

    let created_user = repo.create_user(create_request).await?;
    println!("✅ User created successfully:");
    println!("   ID: {}", created_user.id);
    println!("   Name: {}", created_user.name);
    println!("   Email: {}", created_user.email);
    println!("   Active: {}", created_user.active);
    println!("   Created: {}", created_user.created_at);

    // Test get user by id
    println!("\n3. Testing get user by ID...");
    let retrieved_user = repo.get_user_by_id(created_user.id).await?;
    if let Some(user) = retrieved_user {
        println!("✅ User retrieved successfully:");
        println!("   Name: {}", user.name);
        println!("   Email: {}", user.email);
    } else {
        println!("❌ Failed to retrieve user");
        return Ok(());
    }

    // Test list users
    println!("\n4. Testing list users...");
    let users = repo.list_users().await?;
    println!("✅ Users list retrieved successfully:");
    println!("   Total users: {}", users.len());
    for (i, user) in users.iter().take(3).enumerate() {
        println!("   {}. {} ({}) - Active: {}", i + 1, user.name, user.email, user.active);
    }
    if users.len() > 3 {
        println!("   ... and {} more users", users.len() - 3);
    }

    // Test update user - partial update (name only)
    println!("\n5. Testing user update (name only)...");
    let update_request = UpdateUserRequest {
        name: Some("Updated Operations User".to_string()),
        email: None,
        active: None,
    };

    let updated_user = repo.update_user(created_user.id, update_request).await?;
    if let Some(user) = updated_user {
        println!("✅ User updated successfully:");
        println!("   Name: {} (changed)", user.name);
        println!("   Email: {} (unchanged)", user.email);
        println!("   Active: {} (unchanged)", user.active);
    } else {
        println!("❌ User update failed");
    }

    // Test update user - multiple fields
    println!("\n6. Testing user update (multiple fields)...");
    let update_request = UpdateUserRequest {
        name: Some("Fully Updated User".to_string()),
        email: Some("fully_updated@example.com".to_string()),
        active: Some(false),
    };

    let updated_user = repo.update_user(created_user.id, update_request).await?;
    if let Some(user) = updated_user {
        println!("✅ User updated successfully:");
        println!("   Name: {} (changed)", user.name);
        println!("   Email: {} (changed)", user.email);
        println!("   Active: {} (changed)", user.active);
    } else {
        println!("❌ User update failed");
    }

    // Test edge case: update non-existent user
    println!("\n7. Testing edge case: update non-existent user...");
    let update_request = UpdateUserRequest {
        name: Some("Ghost User".to_string()),
        email: None,
        active: None,
    };

    let not_updated = repo.update_user(99999, update_request).await?;
    if not_updated.is_none() {
        println!("✅ Correctly handled non-existent user update");
    } else {
        println!("❌ Unexpected result for non-existent user");
    }

    // Test delete user
    println!("\n8. Testing user deletion...");
    let deleted = repo.delete_user(created_user.id).await?;
    if deleted {
        println!("✅ User deleted successfully");

        // Verify deletion
        let verified = repo.get_user_by_id(created_user.id).await?;
        if verified.is_none() {
            println!("✅ Deletion verified - user not found");
        } else {
            println!("❌ Deletion failed - user still exists");
        }
    } else {
        println!("❌ User deletion failed");
    }

    // Test edge case: delete non-existent user
    println!("\n9. Testing edge case: delete non-existent user...");
    let not_deleted = repo.delete_user(99999).await?;
    if !not_deleted {
        println!("✅ Correctly handled non-existent user deletion");
    } else {
        println!("❌ Unexpected result for non-existent user");
    }

    println!("\n=== All User database operations completed successfully! ===");

    Ok(())
}