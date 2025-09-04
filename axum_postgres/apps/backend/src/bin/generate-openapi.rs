// OpenAPI specification generator binary
// Generates OpenAPI spec from Rust code and outputs to packages/openapi-spec/openapi.json

use backend::docs::openapi_spec;
use serde_json;
use std::fs;
use std::path::Path;

fn main() -> Result<(), Box<dyn std::error::Error>> {
    eprintln!("=== OpenAPI Specification Generator ===");

    // Generate OpenAPI specification
    eprintln!("1. Generating OpenAPI specification from Rust code...");
    let spec = openapi_spec();
    
    // Convert to formatted JSON
    let json = serde_json::to_string_pretty(&spec)?;
    eprintln!("   ✅ OpenAPI spec generated ({} characters)", json.len());

    // Determine output path
    let output_path = std::env::var("OUTPUT_PATH")
        .unwrap_or_else(|_| "../../packages/openapi-spec/openapi.json".to_string());
    
    eprintln!("2. Writing to output path: {}", output_path);

    // Create directory if it doesn't exist
    if let Some(parent) = Path::new(&output_path).parent() {
        fs::create_dir_all(parent)?;
        eprintln!("   ✅ Output directory ensured");
    }

    // Write JSON to file
    fs::write(&output_path, &json)?;
    eprintln!("   ✅ OpenAPI spec written to: {}", output_path);

    // Validate written file
    let written_content = fs::read_to_string(&output_path)?;
    let parsed: serde_json::Value = serde_json::from_str(&written_content)?;
    
    eprintln!("3. Validation:");
    eprintln!("   ✅ File written successfully");
    eprintln!("   ✅ JSON parsing successful");
    eprintln!("   ✅ OpenAPI version: {}", parsed["openapi"].as_str().unwrap_or("unknown"));
    eprintln!("   ✅ API title: {}", parsed["info"]["title"].as_str().unwrap_or("unknown"));
    eprintln!("   ✅ Schemas count: {}", parsed["components"]["schemas"].as_object().map(|o| o.len()).unwrap_or(0));

    // Output to stdout as well (for piping)
    println!("{}", json);
    
    Ok(())
}