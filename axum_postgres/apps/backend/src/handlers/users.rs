use axum::{
    extract::{Path, State},
    http::StatusCode,
    response::IntoResponse,
    Json,
};
use sqlx::PgPool;
use tracing::{info, warn, error, instrument};
use utoipa;
use validator::Validate;

use crate::error::AppError;
use crate::models::user::{CreateUserRequest, UpdateUserRequest, UserResponse};
use crate::repository::user::{UserRepository, UserRepositoryTrait};

/// Create new user
/// POST /api/users
#[utoipa::path(
    post,
    path = "/api/users",
    request_body = CreateUserRequest,
    responses(
        (status = 201, description = "User created successfully", body = UserResponse),
        (status = 400, description = "Validation error", body = ErrorResponse),
        (status = 500, description = "Internal server error", body = ErrorResponse)
    ),
    tag = "users"
)]
#[instrument(skip(pool))]
pub async fn create_user(
    State(pool): State<PgPool>,
    Json(payload): Json<CreateUserRequest>,
) -> Result<impl IntoResponse, AppError> {
    info!("Creating new user: {}", payload.email);

    // Validate request
    if let Err(errors) = payload.validate() {
        warn!("User creation validation failed: {:?}", errors);
        return Err(AppError::BadRequest(format!(
            "Validation errors: {}",
            errors
                .field_errors()
                .iter()
                .map(|(field, errors)| format!("{}: {}", field, errors[0]))
                .collect::<Vec<_>>()
                .join(", ")
        )));
    }

    let repo = UserRepository::new(pool);

    match repo.create_user(payload).await {
        Ok(user) => {
            info!("User created successfully with ID: {}", user.id);
            let response = user.to_response();
            Ok((StatusCode::CREATED, Json(response)))
        }
        Err(e) => {
            error!("Database error creating user: {:?}", e);
            if e.to_string().contains("duplicate key") || e.to_string().contains("unique constraint") {
                Err(AppError::BadRequest("Email address already exists".to_string()))
            } else {
                Err(AppError::InternalServerError("Failed to create user".to_string()))
            }
        }
    }
}

/// Get user by ID
/// GET /api/users/{id}
#[utoipa::path(
    get,
    path = "/api/users/{id}",
    params(
        ("id" = String, Path, description = "User ID")
    ),
    responses(
        (status = 200, description = "User found", body = UserResponse),
        (status = 400, description = "Invalid user ID format", body = ErrorResponse),
        (status = 404, description = "User not found", body = ErrorResponse),
        (status = 500, description = "Internal server error", body = ErrorResponse)
    ),
    tag = "users"
)]
#[instrument(skip(pool))]
pub async fn get_user_by_id(
    State(pool): State<PgPool>,
    Path(id): Path<String>,
) -> Result<impl IntoResponse, AppError> {
    let user_id = id.parse::<i32>()
        .map_err(|_| AppError::BadRequest("Invalid user ID format".to_string()))?;

    info!("Getting user by ID: {}", user_id);

    let repo = UserRepository::new(pool);

    match repo.get_user_by_id(user_id).await {
        Ok(Some(user)) => {
            info!("User found: {}", user.email);
            let response = user.to_response();
            Ok((StatusCode::OK, Json(response)))
        }
        Ok(None) => {
            warn!("User not found: ID {}", user_id);
            Err(AppError::NotFound("User not found".to_string()))
        }
        Err(e) => {
            error!("Database error getting user: {:?}", e);
            Err(AppError::InternalServerError("Failed to get user".to_string()))
        }
    }
}

/// List all users
/// GET /api/users
#[utoipa::path(
    get,
    path = "/api/users",
    responses(
        (status = 200, description = "List of users", body = Vec<UserResponse>),
        (status = 500, description = "Internal server error", body = ErrorResponse)
    ),
    tag = "users"
)]
#[instrument(skip(pool))]
pub async fn list_users(
    State(pool): State<PgPool>,
) -> Result<impl IntoResponse, AppError> {
    info!("Listing all users");

    let repo = UserRepository::new(pool);

    match repo.list_users().await {
        Ok(users) => {
            info!("Retrieved {} users", users.len());
            let responses = users.into_iter()
                .map(|user| user.to_response())
                .collect::<Vec<UserResponse>>();
            Ok((StatusCode::OK, Json(responses)))
        }
        Err(e) => {
            error!("Database error listing users: {:?}", e);
            Err(AppError::InternalServerError("Failed to list users".to_string()))
        }
    }
}

/// Update user by ID
/// PUT /api/users/{id}
#[utoipa::path(
    put,
    path = "/api/users/{id}",
    params(
        ("id" = String, Path, description = "User ID")
    ),
    request_body = UpdateUserRequest,
    responses(
        (status = 200, description = "User updated successfully", body = UserResponse),
        (status = 400, description = "Validation error", body = ErrorResponse),
        (status = 404, description = "User not found", body = ErrorResponse),
        (status = 500, description = "Internal server error", body = ErrorResponse)
    ),
    tag = "users"
)]
#[instrument(skip(pool))]
pub async fn update_user(
    State(pool): State<PgPool>,
    Path(id): Path<String>,
    Json(payload): Json<UpdateUserRequest>,
) -> Result<impl IntoResponse, AppError> {
    let user_id = id.parse::<i32>()
        .map_err(|_| AppError::BadRequest("Invalid user ID format".to_string()))?;

    info!("Updating user ID: {}", user_id);

    // Validate request
    if let Err(errors) = payload.validate() {
        warn!("User update validation failed: {:?}", errors);
        return Err(AppError::BadRequest(format!(
            "Validation errors: {}",
            errors
                .field_errors()
                .iter()
                .map(|(field, errors)| format!("{}: {}", field, errors[0]))
                .collect::<Vec<_>>()
                .join(", ")
        )));
    }

    let repo = UserRepository::new(pool);

    match repo.update_user(user_id, payload).await {
        Ok(Some(user)) => {
            info!("User updated successfully: {}", user.email);
            let response = user.to_response();
            Ok((StatusCode::OK, Json(response)))
        }
        Ok(None) => {
            warn!("User not found for update: ID {}", user_id);
            Err(AppError::NotFound("User not found".to_string()))
        }
        Err(e) => {
            error!("Database error updating user: {:?}", e);
            if e.to_string().contains("duplicate key") || e.to_string().contains("unique constraint") {
                Err(AppError::BadRequest("Email address already exists".to_string()))
            } else {
                Err(AppError::InternalServerError("Failed to update user".to_string()))
            }
        }
    }
}

/// Delete user by ID
/// DELETE /api/users/{id}
#[utoipa::path(
    delete,
    path = "/api/users/{id}",
    params(
        ("id" = String, Path, description = "User ID")
    ),
    responses(
        (status = 204, description = "User deleted successfully"),
        (status = 400, description = "Invalid user ID format", body = ErrorResponse),
        (status = 404, description = "User not found", body = ErrorResponse),
        (status = 500, description = "Internal server error", body = ErrorResponse)
    ),
    tag = "users"
)]
#[instrument(skip(pool))]
pub async fn delete_user(
    State(pool): State<PgPool>,
    Path(id): Path<String>,
) -> Result<impl IntoResponse, AppError> {
    let user_id = id.parse::<i32>()
        .map_err(|_| AppError::BadRequest("Invalid user ID format".to_string()))?;

    info!("Deleting user ID: {}", user_id);

    let repo = UserRepository::new(pool);

    match repo.delete_user(user_id).await {
        Ok(true) => {
            info!("User deleted successfully: ID {}", user_id);
            Ok(StatusCode::NO_CONTENT)
        }
        Ok(false) => {
            warn!("User not found for deletion: ID {}", user_id);
            Err(AppError::NotFound("User not found".to_string()))
        }
        Err(e) => {
            error!("Database error deleting user: {:?}", e);
            Err(AppError::InternalServerError("Failed to delete user".to_string()))
        }
    }
}