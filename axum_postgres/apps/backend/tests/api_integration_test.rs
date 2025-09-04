use axum::{
    body::Body,
    http::{Method, Request, StatusCode},
    Router,
};
use serde_json::json;
use tower::util::ServiceExt;

use backend::database::create_pool_from_env;
use dotenvy::dotenv;

async fn create_test_app() -> Router {
    dotenv().ok();
    let pool = create_pool_from_env().await.expect("Failed to create test pool");
    
    Router::new()
        .route("/api/users", axum::routing::get(backend::handlers::users::list_users))
        .route("/api/users", axum::routing::post(backend::handlers::users::create_user))
        .route("/api/users/:id", axum::routing::get(backend::handlers::users::get_user_by_id))
        .route("/api/users/:id", axum::routing::put(backend::handlers::users::update_user))
        .route("/api/users/:id", axum::routing::delete(backend::handlers::users::delete_user))
        .with_state(pool)
}

#[tokio::test]
async fn test_user_api_integration() {
    let app = create_test_app().await;

    // Test create user
    let create_request = Request::builder()
        .method(Method::POST)
        .uri("/api/users")
        .header("content-type", "application/json")
        .body(Body::from(
            json!({
                "name": "API Test User",
                "email": "api_test@example.com"
            })
            .to_string(),
        ))
        .unwrap();

    let create_response = app.clone().oneshot(create_request).await.unwrap();
    assert_eq!(create_response.status(), StatusCode::CREATED);

    let create_body = axum::body::to_bytes(create_response.into_body(), usize::MAX)
        .await
        .unwrap();
    let create_json: serde_json::Value = serde_json::from_slice(&create_body).unwrap();
    let user_id = create_json["id"].as_str().unwrap();

    // Test get user by id
    let get_request = Request::builder()
        .method(Method::GET)
        .uri(&format!("/api/users/{}", user_id))
        .body(Body::empty())
        .unwrap();

    let get_response = app.clone().oneshot(get_request).await.unwrap();
    assert_eq!(get_response.status(), StatusCode::OK);

    let get_body = axum::body::to_bytes(get_response.into_body(), usize::MAX)
        .await
        .unwrap();
    let get_json: serde_json::Value = serde_json::from_slice(&get_body).unwrap();
    assert_eq!(get_json["name"], "API Test User");
    assert_eq!(get_json["email"], "api_test@example.com");

    // Test list users
    let list_request = Request::builder()
        .method(Method::GET)
        .uri("/api/users")
        .body(Body::empty())
        .unwrap();

    let list_response = app.clone().oneshot(list_request).await.unwrap();
    assert_eq!(list_response.status(), StatusCode::OK);

    let list_body = axum::body::to_bytes(list_response.into_body(), usize::MAX)
        .await
        .unwrap();
    let list_json: serde_json::Value = serde_json::from_slice(&list_body).unwrap();
    assert!(list_json.is_array());
    assert!(list_json.as_array().unwrap().len() > 0);

    // Test update user
    let update_request = Request::builder()
        .method(Method::PUT)
        .uri(&format!("/api/users/{}", user_id))
        .header("content-type", "application/json")
        .body(Body::from(
            json!({
                "name": "Updated API User",
                "active": false
            })
            .to_string(),
        ))
        .unwrap();

    let update_response = app.clone().oneshot(update_request).await.unwrap();
    assert_eq!(update_response.status(), StatusCode::OK);

    let update_body = axum::body::to_bytes(update_response.into_body(), usize::MAX)
        .await
        .unwrap();
    let update_json: serde_json::Value = serde_json::from_slice(&update_body).unwrap();
    assert_eq!(update_json["name"], "Updated API User");
    assert_eq!(update_json["active"], false);

    // Test delete user
    let delete_request = Request::builder()
        .method(Method::DELETE)
        .uri(&format!("/api/users/{}", user_id))
        .body(Body::empty())
        .unwrap();

    let delete_response = app.clone().oneshot(delete_request).await.unwrap();
    assert_eq!(delete_response.status(), StatusCode::NO_CONTENT);

    // Verify user is deleted
    let verify_request = Request::builder()
        .method(Method::GET)
        .uri(&format!("/api/users/{}", user_id))
        .body(Body::empty())
        .unwrap();

    let verify_response = app.clone().oneshot(verify_request).await.unwrap();
    assert_eq!(verify_response.status(), StatusCode::NOT_FOUND);
}

#[tokio::test]
async fn test_user_api_error_cases() {
    let app = create_test_app().await;

    // Test validation error
    let invalid_request = Request::builder()
        .method(Method::POST)
        .uri("/api/users")
        .header("content-type", "application/json")
        .body(Body::from(
            json!({
                "name": "",
                "email": "invalid-email"
            })
            .to_string(),
        ))
        .unwrap();

    let invalid_response = app.clone().oneshot(invalid_request).await.unwrap();
    assert_eq!(invalid_response.status(), StatusCode::BAD_REQUEST);

    // Test get non-existent user
    let not_found_request = Request::builder()
        .method(Method::GET)
        .uri("/api/users/99999")
        .body(Body::empty())
        .unwrap();

    let not_found_response = app.clone().oneshot(not_found_request).await.unwrap();
    assert_eq!(not_found_response.status(), StatusCode::NOT_FOUND);

    // Test update non-existent user
    let update_not_found_request = Request::builder()
        .method(Method::PUT)
        .uri("/api/users/99999")
        .header("content-type", "application/json")
        .body(Body::from(
            json!({
                "name": "Ghost User"
            })
            .to_string(),
        ))
        .unwrap();

    let update_not_found_response = app.clone().oneshot(update_not_found_request).await.unwrap();
    assert_eq!(update_not_found_response.status(), StatusCode::NOT_FOUND);

    // Test delete non-existent user
    let delete_not_found_request = Request::builder()
        .method(Method::DELETE)
        .uri("/api/users/99999")
        .body(Body::empty())
        .unwrap();

    let delete_not_found_response = app.clone().oneshot(delete_not_found_request).await.unwrap();
    assert_eq!(delete_not_found_response.status(), StatusCode::NOT_FOUND);
}