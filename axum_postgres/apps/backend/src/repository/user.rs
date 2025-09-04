use sqlx::PgPool;
use crate::models::user::{User, CreateUserRequest, UpdateUserRequest};

/// User repository trait for database operations
#[async_trait::async_trait]
pub trait UserRepositoryTrait {
    async fn create_user(&self, user: CreateUserRequest) -> Result<User, sqlx::Error>;
    async fn get_user_by_id(&self, id: i32) -> Result<Option<User>, sqlx::Error>;
    async fn list_users(&self) -> Result<Vec<User>, sqlx::Error>;
    async fn update_user(&self, id: i32, user: UpdateUserRequest) -> Result<Option<User>, sqlx::Error>;
    async fn delete_user(&self, id: i32) -> Result<bool, sqlx::Error>;
}

/// User repository implementation with PostgreSQL
pub struct UserRepository {
    pool: PgPool,
}

impl UserRepository {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }
}

#[async_trait::async_trait]
impl UserRepositoryTrait for UserRepository {
    /// Create a new user
    async fn create_user(&self, user: CreateUserRequest) -> Result<User, sqlx::Error> {
        sqlx::query_as!(
            User,
            r#"
            INSERT INTO test_users (name, email) 
            VALUES ($1, $2) 
            RETURNING id, name, email, active, created_at
            "#,
            user.name,
            user.email
        )
        .fetch_one(&self.pool)
        .await
    }

    /// Get user by ID
    async fn get_user_by_id(&self, id: i32) -> Result<Option<User>, sqlx::Error> {
        sqlx::query_as!(
            User,
            r#"
            SELECT id, name, email, active, created_at 
            FROM test_users 
            WHERE id = $1
            "#,
            id
        )
        .fetch_optional(&self.pool)
        .await
    }

    /// List all users ordered by created_at desc
    async fn list_users(&self) -> Result<Vec<User>, sqlx::Error> {
        sqlx::query_as!(
            User,
            r#"
            SELECT id, name, email, active, created_at 
            FROM test_users 
            ORDER BY created_at DESC
            "#
        )
        .fetch_all(&self.pool)
        .await
    }

    /// Update user by ID
    async fn update_user(&self, id: i32, user: UpdateUserRequest) -> Result<Option<User>, sqlx::Error> {
        // Use pattern matching to handle all possible combinations
        // This is more verbose but type-safe with sqlx macros
        match (&user.name, &user.email, user.active) {
            (Some(name), Some(email), Some(active)) => {
                sqlx::query_as!(
                    User,
                    r#"
                    UPDATE test_users 
                    SET name = $1, email = $2, active = $3 
                    WHERE id = $4 
                    RETURNING id, name, email, active, created_at
                    "#,
                    name,
                    email,
                    active,
                    id
                )
                .fetch_optional(&self.pool)
                .await
            }
            (Some(name), Some(email), None) => {
                sqlx::query_as!(
                    User,
                    r#"
                    UPDATE test_users 
                    SET name = $1, email = $2 
                    WHERE id = $3 
                    RETURNING id, name, email, active, created_at
                    "#,
                    name,
                    email,
                    id
                )
                .fetch_optional(&self.pool)
                .await
            }
            (Some(name), None, Some(active)) => {
                sqlx::query_as!(
                    User,
                    r#"
                    UPDATE test_users 
                    SET name = $1, active = $2 
                    WHERE id = $3 
                    RETURNING id, name, email, active, created_at
                    "#,
                    name,
                    active,
                    id
                )
                .fetch_optional(&self.pool)
                .await
            }
            (None, Some(email), Some(active)) => {
                sqlx::query_as!(
                    User,
                    r#"
                    UPDATE test_users 
                    SET email = $1, active = $2 
                    WHERE id = $3 
                    RETURNING id, name, email, active, created_at
                    "#,
                    email,
                    active,
                    id
                )
                .fetch_optional(&self.pool)
                .await
            }
            (Some(name), None, None) => {
                sqlx::query_as!(
                    User,
                    r#"
                    UPDATE test_users 
                    SET name = $1 
                    WHERE id = $2 
                    RETURNING id, name, email, active, created_at
                    "#,
                    name,
                    id
                )
                .fetch_optional(&self.pool)
                .await
            }
            (None, Some(email), None) => {
                sqlx::query_as!(
                    User,
                    r#"
                    UPDATE test_users 
                    SET email = $1 
                    WHERE id = $2 
                    RETURNING id, name, email, active, created_at
                    "#,
                    email,
                    id
                )
                .fetch_optional(&self.pool)
                .await
            }
            (None, None, Some(active)) => {
                sqlx::query_as!(
                    User,
                    r#"
                    UPDATE test_users 
                    SET active = $1 
                    WHERE id = $2 
                    RETURNING id, name, email, active, created_at
                    "#,
                    active,
                    id
                )
                .fetch_optional(&self.pool)
                .await
            }
            (None, None, None) => {
                // No updates, return current user
                self.get_user_by_id(id).await
            }
        }
    }

    /// Delete user by ID
    async fn delete_user(&self, id: i32) -> Result<bool, sqlx::Error> {
        let result = sqlx::query!(
            r#"
            DELETE FROM test_users 
            WHERE id = $1
            "#,
            id
        )
        .execute(&self.pool)
        .await?;

        Ok(result.rows_affected() > 0)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::database::create_pool_from_env;
    use dotenvy::dotenv;

    async fn setup_test_pool() -> PgPool {
        dotenv().ok();
        create_pool_from_env().await.expect("Failed to create test pool")
    }

    #[tokio::test]
    async fn test_create_and_get_user() {
        let pool = setup_test_pool().await;
        let repo = UserRepository::new(pool);

        let create_request = CreateUserRequest {
            name: "Test User".to_string(),
            email: "test@example.com".to_string(),
        };

        let created_user = repo.create_user(create_request).await.expect("Failed to create user");
        assert_eq!(created_user.name, "Test User");
        assert_eq!(created_user.email, "test@example.com");
        assert!(created_user.active);

        let retrieved_user = repo.get_user_by_id(created_user.id).await.expect("Failed to get user");
        assert!(retrieved_user.is_some());
        let user = retrieved_user.unwrap();
        assert_eq!(user.id, created_user.id);
        assert_eq!(user.name, "Test User");
    }

    #[tokio::test]
    async fn test_list_users() {
        let pool = setup_test_pool().await;
        let repo = UserRepository::new(pool);

        let users = repo.list_users().await.expect("Failed to list users");
        // Should have at least the initial test data
        assert!(!users.is_empty());
    }

    #[tokio::test]
    async fn test_update_user() {
        let pool = setup_test_pool().await;
        let repo = UserRepository::new(pool);

        // Create a test user first
        let create_request = CreateUserRequest {
            name: "Update Test User".to_string(),
            email: "update_test@example.com".to_string(),
        };

        let created_user = repo.create_user(create_request).await.expect("Failed to create user");

        // Update the user
        let update_request = UpdateUserRequest {
            name: Some("Updated Name".to_string()),
            email: None,
            active: Some(false),
        };

        let updated_user = repo.update_user(created_user.id, update_request).await.expect("Failed to update user");
        assert!(updated_user.is_some());
        let user = updated_user.unwrap();
        assert_eq!(user.name, "Updated Name");
        assert!(!user.active);
        assert_eq!(user.email, "update_test@example.com"); // Should remain unchanged
    }

    #[tokio::test]
    async fn test_delete_user() {
        let pool = setup_test_pool().await;
        let repo = UserRepository::new(pool);

        // Create a test user first
        let create_request = CreateUserRequest {
            name: "Delete Test User".to_string(),
            email: "delete_test@example.com".to_string(),
        };

        let created_user = repo.create_user(create_request).await.expect("Failed to create user");

        // Delete the user
        let deleted = repo.delete_user(created_user.id).await.expect("Failed to delete user");
        assert!(deleted);

        // Verify user is deleted
        let retrieved_user = repo.get_user_by_id(created_user.id).await.expect("Failed to check deleted user");
        assert!(retrieved_user.is_none());

        // Try to delete non-existent user
        let not_deleted = repo.delete_user(99999).await.expect("Failed to handle non-existent user delete");
        assert!(!not_deleted);
    }
}