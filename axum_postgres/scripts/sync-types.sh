#!/bin/bash

# Integrated Type Sync Pipeline
# Rust → OpenAPI → TypeScript type synchronization

set -e

echo "🔄 Starting integrated type sync pipeline..."
echo "========================================"

# Configuration
BACKEND_DIR="apps/backend"
OPENAPI_DIR="packages/openapi-spec"
OPENAPI_FILE="$OPENAPI_DIR/openapi.json"
TYPES_FILE="$OPENAPI_DIR/generated/types.ts"

# Step 1: Generate OpenAPI spec from Rust
echo "1. 🦀 Generating OpenAPI specification from Rust..."
cd "$BACKEND_DIR"

if ! cargo run --bin generate-openapi > "../../$OPENAPI_FILE" 2>/dev/null; then
    echo "❌ Failed to generate OpenAPI specification"
    echo "   Make sure the Rust backend builds successfully"
    exit 1
fi

cd ../..

echo "   ✅ OpenAPI spec generated: $OPENAPI_FILE"

# Validate OpenAPI file
if [[ ! -f "$OPENAPI_FILE" ]] || [[ ! -s "$OPENAPI_FILE" ]]; then
    echo "❌ OpenAPI file was not created or is empty"
    exit 1
fi

# Step 2: Validate OpenAPI JSON
echo "2. 🔍 Validating OpenAPI specification..."
if ! jq empty "$OPENAPI_FILE" 2>/dev/null; then
    echo "❌ Generated OpenAPI spec is not valid JSON"
    exit 1
fi

OPENAPI_VERSION=$(jq -r '.openapi // "unknown"' "$OPENAPI_FILE")
API_TITLE=$(jq -r '.info.title // "unknown"' "$OPENAPI_FILE")
SCHEMA_COUNT=$(jq '.components.schemas | keys | length' "$OPENAPI_FILE")

echo "   ✅ Valid OpenAPI $OPENAPI_VERSION specification"
echo "   ✅ Title: $API_TITLE"
echo "   ✅ Schemas: $SCHEMA_COUNT defined"

# Step 3: Generate TypeScript types
echo "3. 📝 Generating TypeScript types from OpenAPI..."
cd "$OPENAPI_DIR"

if ! npm run generate-types > /dev/null 2>&1; then
    echo "❌ Failed to generate TypeScript types"
    echo "   Check openapi-typescript configuration"
    exit 1
fi

cd ../..

echo "   ✅ TypeScript types generated: $TYPES_FILE"

# Validate TypeScript file
if [[ ! -f "$TYPES_FILE" ]] || [[ ! -s "$TYPES_FILE" ]]; then
    echo "❌ TypeScript file was not created or is empty"
    exit 1
fi

# Step 4: Validate TypeScript compilation
echo "4. ✅ Validating TypeScript compilation..."
cd "$OPENAPI_DIR"

if ! npx tsc --noEmit generated/types.ts 2>/dev/null; then
    echo "❌ Generated TypeScript types do not compile"
    exit 1
fi

cd ../..

# Step 5: Content validation
echo "5. 🔍 Validating generated content..."

TYPE_COUNT=$(grep -c "^\s*[A-Z][a-zA-Z]*:" "$TYPES_FILE" || true)
echo "   ✅ TypeScript types defined: $TYPE_COUNT"

# Check for essential types
REQUIRED_TYPES=("UserResponse" "CreateUserRequest" "UpdateUserRequest" "ErrorResponse")
for type_name in "${REQUIRED_TYPES[@]}"; do
    if grep -q "$type_name" "$TYPES_FILE"; then
        echo "   ✅ $type_name type found"
    else
        echo "   ⚠️  $type_name type not found"
    fi
done

# Summary
echo ""
echo "🎉 Type sync pipeline completed successfully!"
echo "========================================"
echo "📊 Pipeline Results:"
echo "   • OpenAPI spec: $OPENAPI_FILE ($(wc -c < "$OPENAPI_FILE") bytes)"
echo "   • TypeScript types: $TYPES_FILE ($(wc -c < "$TYPES_FILE") bytes)"
echo "   • Schemas: $SCHEMA_COUNT OpenAPI schemas"  
echo "   • Types: $TYPE_COUNT TypeScript type definitions"
echo ""
echo "🚀 Types are now synchronized across Rust ↔ TypeScript!"

# Optional: Show file modification times for change detection
echo "📅 File timestamps:"
echo "   OpenAPI: $(stat -c '%y' "$OPENAPI_FILE")"
echo "   Types:   $(stat -c '%y' "$TYPES_FILE")"