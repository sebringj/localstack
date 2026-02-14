#!/bin/bash

# Start all local development dependencies

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_DIR"

# Source environment variables
if [ -f .env ]; then
    source .env
fi

echo "🚀 Starting LocalStack..."

# Set auth token if available
if [ -n "$LOCALSTACK_AUTH_TOKEN" ]; then
    localstack auth set-token "$LOCALSTACK_AUTH_TOKEN"
fi

# Start LocalStack in background
localstack start -d

echo "⏳ Waiting for LocalStack to be ready..."
localstack wait -t 60

echo "✅ LocalStack is running!"

# Deploy the app
"$SCRIPT_DIR/deploy.sh"

echo ""
echo "✅ All local dependencies started!"
echo ""
echo "To start the frontend, run:"
echo "   cd frontend && npm install && npm run dev"
