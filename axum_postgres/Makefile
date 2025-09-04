# axum_postgres Makefile
# Integrated development workflow for Rust + TypeScript monorepo

.PHONY: help dev build test clean sync-types generate-openapi generate-ts-types lint check

# Default target
help:
	@echo "🦀 axum_postgres Development Workflow"
	@echo "====================================="
	@echo ""
	@echo "📋 Available commands:"
	@echo "  make dev                  - Start full development environment"
	@echo "  make build               - Build all components (Rust + TypeScript)"
	@echo "  make test                - Run all test suites"
	@echo "  make clean               - Clean all build artifacts"
	@echo ""
	@echo "🔄 Type Synchronization:"
	@echo "  make sync-types          - Full type sync pipeline (Rust → OpenAPI → TS)"
	@echo "  make generate-openapi    - Generate OpenAPI spec from Rust"
	@echo "  make generate-ts-types   - Generate TypeScript types from OpenAPI"
	@echo ""
	@echo "✅ Quality Assurance:"
	@echo "  make check               - Check compilation (Rust + TypeScript)"
	@echo "  make lint                - Run linters"
	@echo ""
	@echo "🔧 Infrastructure:"
	@echo "  make docker-up           - Start PostgreSQL"
	@echo "  make docker-down         - Stop PostgreSQL"

# Development workflow
dev: sync-types docker-up
	@echo "🚀 Development environment ready!"
	@echo "   - PostgreSQL: http://localhost:5435"
	@echo "   - Backend: cargo run --bin backend (port 3000)" 
	@echo "   - Types: synchronized"

# Build all components
build: sync-types
	@echo "🔨 Building all components..."
	cd apps/backend && cargo build --release
	npm run build --workspaces --if-present
	@echo "✅ Build completed successfully"

# Test all components  
test:
	@echo "🧪 Running all tests..."
	cd apps/backend && cargo test
	npm run test --workspaces --if-present
	@echo "✅ All tests completed"

# Clean build artifacts
clean:
	@echo "🧹 Cleaning build artifacts..."
	cd apps/backend && cargo clean
	npm run clean --workspaces --if-present
	rm -rf node_modules packages/*/node_modules
	@echo "✅ Clean completed"

# Type synchronization pipeline
sync-types:
	@echo "🔄 Starting type synchronization..."
	./scripts/sync-types.sh

# Generate OpenAPI specification
generate-openapi:
	@echo "🦀 Generating OpenAPI spec from Rust..."
	cd apps/backend && cargo run --bin generate-openapi > ../../packages/openapi-spec/openapi.json
	@echo "✅ OpenAPI spec generated"

# Generate TypeScript types  
generate-ts-types:
	@echo "📝 Generating TypeScript types..."
	cd packages/openapi-spec && npm run generate-types
	@echo "✅ TypeScript types generated"

# Quality checks
check: 
	@echo "✅ Checking compilation..."
	cd apps/backend && cargo check
	npm run type-check --workspaces --if-present

lint:
	@echo "✅ Running linters..."
	cd apps/backend && cargo clippy
	cd apps/backend && cargo fmt --check  
	npm run lint --workspaces --if-present

# Infrastructure
docker-up:
	@echo "🐳 Starting PostgreSQL..."
	docker-compose up -d postgres
	@echo "✅ PostgreSQL started (port 5435)"

docker-down:
	@echo "🐳 Stopping Docker services..."
	docker-compose down
	@echo "✅ Docker services stopped"

# Backend specific
backend-dev:
	cd apps/backend && cargo run --bin backend

backend-watch:
	cd apps/backend && cargo watch -x "run --bin backend"

# Database operations
db-check:
	@echo "🗄️  Checking database connection..."
	./scripts/check_db.sh

db-migrate:
	@echo "🗄️  Running database migrations..."
	cd apps/backend && PGPASSWORD=password psql -h localhost -p 5435 -U postgres -d promana_dev -f migrations/001_initial.sql

# Show status
status:
	@echo "📊 Project Status:"
	@echo "   Rust version: $$(rustc --version)"
	@echo "   Node version: $$(node --version)"
	@echo "   OpenAPI spec: $$(if [ -f packages/openapi-spec/openapi.json ]; then echo "✅ Present"; else echo "❌ Missing"; fi)"
	@echo "   TS types: $$(if [ -f packages/openapi-spec/generated/types.ts ]; then echo "✅ Present"; else echo "❌ Missing"; fi)"