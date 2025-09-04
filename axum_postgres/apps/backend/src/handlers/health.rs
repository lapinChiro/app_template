use axum::{response::IntoResponse, Json};
use serde_json::json;

/// Health check endpoint
/// Returns system status and current timestamp
pub async fn health() -> impl IntoResponse {
    Json(json!({
        "status": "ok",
        "timestamp": chrono::Utc::now()
    }))
}