// Simple OpenAPI test binary
use serde_json;

fn main() {
    println!("=== Simple OpenAPI Test ===");

    // Test basic utoipa functionality
    use utoipa::OpenApi;
    use backend::models::user::{UserResponse, CreateUserRequest};

    #[derive(OpenApi)]
    #[openapi(
        components(
            schemas(UserResponse, CreateUserRequest)
        ),
        info(
            title = "Test API",
            version = "1.0.0"
        )
    )]
    struct TestApi;

    let spec = TestApi::openapi();
    let json = serde_json::to_string_pretty(&spec).expect("Failed to serialize");
    
    println!("OpenAPI spec generated successfully:");
    println!("Title: {}", spec.info.title);
    println!("Version: {}", spec.info.version);
    
    println!("JSON length: {} characters", json.len());
    
    if json.len() > 100 {
        println!("✅ OpenAPI generation working correctly");
        println!("First 200 chars: {}", &json[..200.min(json.len())]);
    } else {
        println!("❌ OpenAPI generation failed");
    }
}