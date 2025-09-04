use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use serde_json::json;
use sqlx::FromRow;
use utoipa::ToSchema;
use validator::Validate;

/// User model for database operations
/// Maps to the test_users table
#[derive(Debug, Clone, Serialize, Deserialize, FromRow, ToSchema)]
pub struct User {
    pub id: i32,
    pub name: String,
    pub email: String,
    pub active: bool,
    pub created_at: DateTime<Utc>,
}

/// User model for API responses
/// Converts database id (i32) to string for JSON compatibility
#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
#[schema(example = json!({"id": "1", "name": "John Doe", "email": "john@example.com", "active": true, "created_at": "2024-01-01T00:00:00Z"}))]
pub struct UserResponse {
    pub id: String,
    pub name: String,
    pub email: String,
    pub active: bool,
    pub created_at: String,
}

/// User creation request model
#[derive(Debug, Clone, Serialize, Deserialize, Validate, ToSchema)]
#[schema(example = json!({"name": "Jane Doe", "email": "jane@example.com"}))]
pub struct CreateUserRequest {
    #[validate(length(min = 1, message = "Name cannot be empty"))]
    #[schema(min_length = 1, example = "Jane Doe")]
    pub name: String,
    
    #[validate(email(message = "Invalid email format"))]
    #[schema(format = "email", example = "jane@example.com")]
    pub email: String,
}

/// User update request model
#[derive(Debug, Clone, Serialize, Deserialize, Validate, ToSchema)]
#[schema(example = json!({"name": "Jane Smith", "email": "jane.smith@example.com", "active": false}))]
pub struct UpdateUserRequest {
    #[validate(length(min = 1, message = "Name cannot be empty"))]
    #[schema(min_length = 1, example = "Jane Smith")]
    pub name: Option<String>,
    
    #[validate(email(message = "Invalid email format"))]
    #[schema(format = "email", example = "jane.smith@example.com")]
    pub email: Option<String>,
    
    #[schema(example = false)]
    pub active: Option<bool>,
}

/// Error response model for API errors
#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
#[schema(example = json!({"success": false, "message": "Error occurred"}))]
pub struct ErrorResponse {
    pub success: bool,
    pub message: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<String>,
}

impl ErrorResponse {
    pub fn new(message: String) -> Self {
        Self {
            success: false,
            message,
            error: None,
        }
    }

    pub fn with_error(message: String, error: String) -> Self {
        Self {
            success: false,
            message,
            error: Some(error),
        }
    }
}

impl From<User> for UserResponse {
    /// Convert database User to API UserResponse
    fn from(user: User) -> Self {
        Self {
            id: user.id.to_string(),
            name: user.name,
            email: user.email,
            active: user.active,
            created_at: user.created_at.to_rfc3339(),
        }
    }
}

impl User {
    /// Convert to API response format
    pub fn to_response(self) -> UserResponse {
        self.into()
    }
    
    /// Convert list of users to API response format
    pub fn list_to_response(users: Vec<User>) -> Vec<UserResponse> {
        users.into_iter().map(|user| user.into()).collect()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_user_serialization() {
        let user = User {
            id: 1,
            name: "Test User".to_string(),
            email: "test@example.com".to_string(),
            active: true,
            created_at: Utc::now(),
        };
        
        // Test serialization to JSON
        let json = serde_json::to_string(&user).expect("Failed to serialize user");
        assert!(json.contains("Test User"));
        assert!(json.contains("test@example.com"));
        
        // Test conversion to API response
        let response = user.to_response();
        assert_eq!(response.id, "1");
        assert_eq!(response.name, "Test User");
        assert!(!response.created_at.is_empty());
    }
    
    #[test]
    fn test_create_user_request_validation() {
        use validator::Validate;
        
        // Valid request
        let valid_request = CreateUserRequest {
            name: "Valid User".to_string(),
            email: "valid@example.com".to_string(),
        };
        assert!(valid_request.validate().is_ok());
        
        // Invalid email
        let invalid_email = CreateUserRequest {
            name: "Valid User".to_string(),
            email: "invalid-email".to_string(),
        };
        assert!(invalid_email.validate().is_err());
        
        // Empty name
        let empty_name = CreateUserRequest {
            name: "".to_string(),
            email: "valid@example.com".to_string(),
        };
        assert!(empty_name.validate().is_err());
    }
    
    #[test]
    fn test_update_user_request_validation() {
        use validator::Validate;
        
        // Valid partial update
        let valid_update = UpdateUserRequest {
            name: Some("Updated Name".to_string()),
            email: None,
            active: Some(false),
        };
        assert!(valid_update.validate().is_ok());
        
        // Invalid email update
        let invalid_email = UpdateUserRequest {
            name: None,
            email: Some("invalid-email".to_string()),
            active: None,
        };
        assert!(invalid_email.validate().is_err());
        
        // Empty name update
        let empty_name = UpdateUserRequest {
            name: Some("".to_string()),
            email: None,
            active: None,
        };
        assert!(empty_name.validate().is_err());
    }
}