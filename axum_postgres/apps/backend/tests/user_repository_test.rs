use backend::database::create_pool_from_env;
use backend::models::user::{CreateUserRequest, UpdateUserRequest};
use backend::repository::user::{UserRepository, UserRepositoryTrait};
use dotenvy::dotenv;

#[tokio::test]
async fn test_user_repository_integration() {
    dotenv().ok();

    let pool = create_pool_from_env()
        .await
        .expect("Failed to create database pool");

    let repo = UserRepository::new(pool);

    // Test create user
    let create_request = CreateUserRequest {
        name: "Integration Test User".to_string(),
        email: "integration_test@example.com".to_string(),
    };

    let created_user = repo
        .create_user(create_request)
        .await
        .expect("Failed to create user");

    assert_eq!(created_user.name, "Integration Test User");
    assert_eq!(created_user.email, "integration_test@example.com");
    assert!(created_user.active);

    // Test get user by id
    let retrieved_user = repo
        .get_user_by_id(created_user.id)
        .await
        .expect("Failed to get user");

    assert!(retrieved_user.is_some());
    let user = retrieved_user.unwrap();
    assert_eq!(user.id, created_user.id);
    assert_eq!(user.name, "Integration Test User");

    // Test list users
    let users = repo.list_users().await.expect("Failed to list users");
    assert!(!users.is_empty());
    assert!(users.iter().any(|u| u.id == created_user.id));

    // Test update user
    let update_request = UpdateUserRequest {
        name: Some("Updated Integration User".to_string()),
        email: None,
        active: Some(false),
    };

    let updated_user = repo
        .update_user(created_user.id, update_request)
        .await
        .expect("Failed to update user");

    assert!(updated_user.is_some());
    let user = updated_user.unwrap();
    assert_eq!(user.name, "Updated Integration User");
    assert!(!user.active);
    assert_eq!(user.email, "integration_test@example.com");

    // Test delete user
    let deleted = repo
        .delete_user(created_user.id)
        .await
        .expect("Failed to delete user");

    assert!(deleted);

    // Verify user is deleted
    let deleted_user = repo
        .get_user_by_id(created_user.id)
        .await
        .expect("Failed to check deleted user");

    assert!(deleted_user.is_none());
}

#[tokio::test]
async fn test_user_repository_edge_cases() {
    dotenv().ok();

    let pool = create_pool_from_env()
        .await
        .expect("Failed to create database pool");

    let repo = UserRepository::new(pool);

    // Test get non-existent user
    let non_existent = repo
        .get_user_by_id(99999)
        .await
        .expect("Failed to handle non-existent user");

    assert!(non_existent.is_none());

    // Test delete non-existent user
    let not_deleted = repo
        .delete_user(99999)
        .await
        .expect("Failed to handle non-existent user delete");

    assert!(!not_deleted);

    // Test update non-existent user
    let update_request = UpdateUserRequest {
        name: Some("Non-existent User".to_string()),
        email: None,
        active: None,
    };

    let not_updated = repo
        .update_user(99999, update_request)
        .await
        .expect("Failed to handle non-existent user update");

    assert!(not_updated.is_none());
}