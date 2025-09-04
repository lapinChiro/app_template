use axum::{
    http::StatusCode,
    response::{Html, IntoResponse, Json},
    routing::{delete, get, post, put},
    Router,
};
use tower::ServiceBuilder;
use tower_http::{cors::CorsLayer, trace::TraceLayer};
use tracing::{info, instrument, error};
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};
use utoipa::OpenApi;
use utoipa_swagger_ui::SwaggerUi;

#[tokio::main]
async fn main() {
    // Load environment variables from .env file
    dotenvy::dotenv().ok();

    // Initialize tracing
    tracing_subscriber::registry()
        .with(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "backend=debug,tower_http=debug".into()),
        )
        .with(tracing_subscriber::fmt::layer())
        .init();

    info!("Starting axum_postgres backend server");

    // Create database connection pool
    let pool = backend::database::create_pool_from_env()
        .await
        .map_err(|e| {
            error!("Failed to create database pool: {:?}", e);
            std::process::exit(1);
        })
        .unwrap();

    info!("Database connection pool created successfully");

    let app = create_app(pool);

    let port = std::env::var("PORT").unwrap_or_else(|_| "3000".to_string());
    let host = std::env::var("HOST").unwrap_or_else(|_| "0.0.0.0".to_string());
    let addr = format!("{}:{}", host, port);

    info!("Server running on http://{}", addr);

    let listener = tokio::net::TcpListener::bind(&addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}

fn create_app(pool: sqlx::PgPool) -> Router {
    Router::new()
        // Routes
        .route("/", get(root))
        .route("/health", get(backend::handlers::health::health))
        // User API routes
        .route("/api/users", get(backend::handlers::users::list_users))
        .route("/api/users", post(backend::handlers::users::create_user))
        .route("/api/users/:id", get(backend::handlers::users::get_user_by_id))
        .route("/api/users/:id", put(backend::handlers::users::update_user))
        .route("/api/users/:id", delete(backend::handlers::users::delete_user))
        // OpenAPI documentation routes
        .route("/api-docs/openapi.json", get(openapi_spec))
        // State
        .with_state(pool)
        // Middleware
        .layer(
            ServiceBuilder::new()
                .layer(TraceLayer::new_for_http())
                .layer(CorsLayer::permissive()),
        )
        // Fallback for 404
        .fallback(handler_404)
}

/// OpenAPI specification endpoint
/// GET /api-docs/openapi.json
#[instrument]
async fn openapi_spec() -> impl IntoResponse {
    Json(backend::docs::openapi_spec())
}

/// Root endpoint - returns basic message
#[instrument]
async fn root() -> impl IntoResponse {
    Html("Hello, World!")
}

/// 404 handler
#[instrument]
async fn handler_404() -> impl IntoResponse {
    (
        StatusCode::NOT_FOUND,
        Html("<h1>404 - Page Not Found</h1>"),
    )
}
