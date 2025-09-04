// User serialization test binary
use backend::models::user::{User, UserResponse, CreateUserRequest, UpdateUserRequest};
use chrono::Utc;
use serde_json;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    println!("=== User Serialization Test ===");

    // Test User struct serialization
    println!("1. Testing User struct serialization...");
    let user = User {
        id: 42,
        name: "Alice Johnson".to_string(),
        email: "alice@example.com".to_string(),
        active: true,
        created_at: Utc::now(),
    };

    let user_json = serde_json::to_string_pretty(&user)?;
    println!("User JSON:\n{}", user_json);

    // Test deserialization
    let user_from_json: User = serde_json::from_str(&user_json)?;
    println!("✅ User serialization/deserialization successful");
    println!("   Deserialized: {} ({})", user_from_json.name, user_from_json.email);

    // Test UserResponse conversion
    println!("\n2. Testing UserResponse conversion...");
    let user_response = user.clone().to_response();
    let response_json = serde_json::to_string_pretty(&user_response)?;
    println!("UserResponse JSON:\n{}", response_json);
    println!("✅ UserResponse conversion successful");
    println!("   ID converted: {} -> {}", user.id, user_response.id);

    // Test CreateUserRequest validation
    println!("\n3. Testing CreateUserRequest validation...");
    
    // Valid request
    let valid_request = CreateUserRequest {
        name: "Bob Smith".to_string(),
        email: "bob@example.com".to_string(),
    };
    
    match validator::Validate::validate(&valid_request) {
        Ok(_) => println!("✅ Valid CreateUserRequest validation passed"),
        Err(e) => println!("❌ Valid CreateUserRequest validation failed: {:?}", e),
    }

    // Invalid email request
    let invalid_email_request = CreateUserRequest {
        name: "Charlie Brown".to_string(),
        email: "invalid-email".to_string(),
    };
    
    match validator::Validate::validate(&invalid_email_request) {
        Ok(_) => println!("❌ Invalid email validation should have failed"),
        Err(e) => {
            println!("✅ Invalid email validation correctly failed");
            println!("   Errors: {:?}", e);
        }
    }

    // Empty name request
    let empty_name_request = CreateUserRequest {
        name: "".to_string(),
        email: "test@example.com".to_string(),
    };
    
    match validator::Validate::validate(&empty_name_request) {
        Ok(_) => println!("❌ Empty name validation should have failed"),
        Err(e) => {
            println!("✅ Empty name validation correctly failed");
            println!("   Errors: {:?}", e);
        }
    }

    // Test UpdateUserRequest validation
    println!("\n4. Testing UpdateUserRequest validation...");
    
    let valid_update = UpdateUserRequest {
        name: Some("Updated Name".to_string()),
        email: Some("updated@example.com".to_string()),
        active: Some(false),
    };
    
    match validator::Validate::validate(&valid_update) {
        Ok(_) => println!("✅ Valid UpdateUserRequest validation passed"),
        Err(e) => println!("❌ Valid UpdateUserRequest validation failed: {:?}", e),
    }

    let update_json = serde_json::to_string_pretty(&valid_update)?;
    println!("UpdateUserRequest JSON:\n{}", update_json);

    // Test list conversion
    println!("\n5. Testing list conversion...");
    let users = vec![
        User {
            id: 1,
            name: "User One".to_string(),
            email: "one@example.com".to_string(),
            active: true,
            created_at: Utc::now(),
        },
        User {
            id: 2,
            name: "User Two".to_string(),
            email: "two@example.com".to_string(),
            active: false,
            created_at: Utc::now(),
        },
    ];

    let responses = User::list_to_response(users);
    let responses_json = serde_json::to_string_pretty(&responses)?;
    println!("User list responses JSON:\n{}", responses_json);
    println!("✅ List conversion successful");

    println!("\n=== All User serialization tests completed successfully! ===");
    Ok(())
}