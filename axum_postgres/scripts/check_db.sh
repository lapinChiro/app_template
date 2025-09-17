#!/bin/bash

# PostgreSQL Docker environment health check script

set -e

echo "=== PostgreSQL Docker Environment Health Check ==="

# Configuration
DB_HOST="localhost"
DB_PORT="5435"
DB_NAME="dev"
DB_USER="postgres"
DB_PASSWORD="password"
DB_URL="postgresql://$DB_USER:$DB_PASSWORD@$DB_HOST:$DB_PORT/$DB_NAME"

echo "Checking PostgreSQL connection..."
echo "Host: $DB_HOST:$DB_PORT"
echo "Database: $DB_NAME"
echo "User: $DB_USER"
echo

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL to be ready..."
timeout 30s sh -c 'until nc -z localhost 5435; do sleep 1; done'

if [ $? -eq 0 ]; then
    echo "✅ PostgreSQL port is open"
else
    echo "❌ PostgreSQL port is not accessible"
    exit 1
fi

# Test database connection
echo "🔌 Testing database connection..."
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "SELECT version();" > /dev/null 2>&1

if [ $? -eq 0 ]; then
    echo "✅ Database connection successful"
else
    echo "❌ Database connection failed"
    exit 1
fi

# Check database exists
echo "🗄️  Checking database exists..."
DB_EXISTS=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -tc "SELECT 1 FROM pg_database WHERE datname='$DB_NAME';" | xargs)

if [ "$DB_EXISTS" = "1" ]; then
    echo "✅ Database '$DB_NAME' exists"
else
    echo "❌ Database '$DB_NAME' does not exist"
    exit 1
fi

# Run health check query
echo "🏥 Running health check query..."
HEALTH_RESULT=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -tc "SELECT 'OK' as status;" | xargs)

if [ "$HEALTH_RESULT" = "OK" ]; then
    echo "✅ Health check query successful"
else
    echo "❌ Health check query failed"
    exit 1
fi

# Display connection info
echo "📊 Database Information:"
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "
SELECT 
    current_database() as database_name,
    current_user as current_user,
    version() as postgresql_version;
"

echo "✅ All PostgreSQL Docker environment checks passed!"
echo "Connection string: $DB_URL"