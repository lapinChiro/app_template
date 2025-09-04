use utoipa::OpenApi;
use crate::models::user::{UserResponse, CreateUserRequest, UpdateUserRequest, ErrorResponse};

/// Simplified OpenAPI documentation configuration
#[derive(OpenApi)]
#[openapi(
    components(
        schemas(UserResponse, CreateUserRequest, UpdateUserRequest, ErrorResponse)
    ),
    tags(
        (name = "users", description = "User management operations")
    ),
    info(
        title = "axum_postgres API",
        description = "Project Management API built with Rust + Axum + PostgreSQL",
        version = "1.0.0"
    )
)]
pub struct ApiDoc;

/// Get OpenAPI specification as JSON  
pub fn openapi_spec() -> utoipa::openapi::OpenApi {
    ApiDoc::openapi()
}