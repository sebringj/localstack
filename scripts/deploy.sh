#!/bin/bash

# LocalStack deployment script for Todo App
# This script sets up DynamoDB tables, Lambda functions, and API Gateway

set -e

# Ensure homebrew binaries are in PATH (for VS Code tasks)
export PATH="/opt/homebrew/bin:$PATH"

LOCALSTACK_ENDPOINT="http://localhost:4566"
REGION="us-east-1"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

echo "🚀 Deploying Todo App to LocalStack..."

# Wait for LocalStack to be ready
echo "⏳ Waiting for LocalStack to be ready..."
until aws --endpoint-url=$LOCALSTACK_ENDPOINT --region=$REGION sts get-caller-identity > /dev/null 2>&1; do
    sleep 2
done
echo "✅ LocalStack is ready!"

# Create DynamoDB tables
echo "📦 Creating DynamoDB tables..."

# Users table
aws --endpoint-url=$LOCALSTACK_ENDPOINT --region=$REGION dynamodb create-table \
    --table-name users \
    --attribute-definitions AttributeName=username,AttributeType=S \
    --key-schema AttributeName=username,KeyType=HASH \
    --billing-mode PAY_PER_REQUEST \
    2>/dev/null || echo "   Users table already exists"

# Todos table (with username as partition key, todo_id as sort key)
aws --endpoint-url=$LOCALSTACK_ENDPOINT --region=$REGION dynamodb create-table \
    --table-name todos \
    --attribute-definitions \
        AttributeName=username,AttributeType=S \
        AttributeName=todo_id,AttributeType=S \
    --key-schema \
        AttributeName=username,KeyType=HASH \
        AttributeName=todo_id,KeyType=RANGE \
    --billing-mode PAY_PER_REQUEST \
    2>/dev/null || echo "   Todos table already exists"

echo "✅ DynamoDB tables created!"

# Create test user (password: testpass -> sha256 hash)
echo "👤 Creating test user..."
# Hash of 'testpass': 8c1dc31e6c5e8e5c1ef6ec25b1e9e4f72c4d3c5e7f8a9b0c1d2e3f4a5b6c7d8e
TEST_PASSWORD_HASH="8c1dc31e6c5e8e5c1ef6ec25b1e9e4f72c4d3c5e7f8a9b0c1d2e3f4a5b6c7d8e"
# Actually hash 'testpass' with sha256
TEST_PASSWORD_HASH=$(echo -n "testpass" | shasum -a 256 | cut -d' ' -f1)

aws --endpoint-url=$LOCALSTACK_ENDPOINT --region=$REGION dynamodb put-item \
    --table-name users \
    --item '{
        "username": {"S": "testuser"},
        "password": {"S": "'$TEST_PASSWORD_HASH'"}
    }'
echo "✅ Test user created (username: testuser, password: testpass)"

# Package Lambda functions
echo "📦 Packaging Lambda functions..."

cd "$PROJECT_DIR/backend"

# Create auth lambda zip
cd auth
zip -r ../auth.zip handler.py
cd ..

# Create todos lambda zip
cd todos
zip -r ../todos.zip handler.py
cd ..

echo "✅ Lambda functions packaged!"

# Create Lambda functions
echo "🔧 Creating Lambda functions..."

# Auth Lambda
aws --endpoint-url=$LOCALSTACK_ENDPOINT --region=$REGION lambda create-function \
    --function-name auth-handler \
    --runtime python3.9 \
    --handler handler.handler \
    --zip-file fileb://auth.zip \
    --role arn:aws:iam::000000000000:role/lambda-role \
    --environment "Variables={LOCALSTACK_ENDPOINT=$LOCALSTACK_ENDPOINT}" \
    2>/dev/null || aws --endpoint-url=$LOCALSTACK_ENDPOINT --region=$REGION lambda update-function-code \
        --function-name auth-handler \
        --zip-file fileb://auth.zip

# Todos Lambda
aws --endpoint-url=$LOCALSTACK_ENDPOINT --region=$REGION lambda create-function \
    --function-name todos-handler \
    --runtime python3.9 \
    --handler handler.handler \
    --zip-file fileb://todos.zip \
    --role arn:aws:iam::000000000000:role/lambda-role \
    --environment "Variables={LOCALSTACK_ENDPOINT=$LOCALSTACK_ENDPOINT}" \
    2>/dev/null || aws --endpoint-url=$LOCALSTACK_ENDPOINT --region=$REGION lambda update-function-code \
        --function-name todos-handler \
        --zip-file fileb://todos.zip

echo "✅ Lambda functions created!"

# Create API Gateway
echo "🌐 Creating API Gateway..."

# Create REST API
API_ID=$(aws --endpoint-url=$LOCALSTACK_ENDPOINT --region=$REGION apigateway create-rest-api \
    --name todoapi \
    --query 'id' --output text 2>/dev/null || \
    aws --endpoint-url=$LOCALSTACK_ENDPOINT --region=$REGION apigateway get-rest-apis \
        --query "items[?name=='todoapi'].id" --output text)

echo "   API ID: $API_ID"

# Get root resource ID
ROOT_ID=$(aws --endpoint-url=$LOCALSTACK_ENDPOINT --region=$REGION apigateway get-resources \
    --rest-api-id $API_ID \
    --query "items[?path=='/'].id" --output text)

echo "   Root ID: $ROOT_ID"

# Create /auth resource
AUTH_ID=$(aws --endpoint-url=$LOCALSTACK_ENDPOINT --region=$REGION apigateway create-resource \
    --rest-api-id $API_ID \
    --parent-id $ROOT_ID \
    --path-part auth \
    --query 'id' --output text 2>/dev/null || \
    aws --endpoint-url=$LOCALSTACK_ENDPOINT --region=$REGION apigateway get-resources \
        --rest-api-id $API_ID \
        --query "items[?pathPart=='auth'].id" --output text)

# Create POST method for /auth
aws --endpoint-url=$LOCALSTACK_ENDPOINT --region=$REGION apigateway put-method \
    --rest-api-id $API_ID \
    --resource-id $AUTH_ID \
    --http-method POST \
    --authorization-type NONE 2>/dev/null || true

aws --endpoint-url=$LOCALSTACK_ENDPOINT --region=$REGION apigateway put-method \
    --rest-api-id $API_ID \
    --resource-id $AUTH_ID \
    --http-method OPTIONS \
    --authorization-type NONE 2>/dev/null || true

# Integrate auth with Lambda
aws --endpoint-url=$LOCALSTACK_ENDPOINT --region=$REGION apigateway put-integration \
    --rest-api-id $API_ID \
    --resource-id $AUTH_ID \
    --http-method POST \
    --type AWS_PROXY \
    --integration-http-method POST \
    --uri "arn:aws:apigateway:$REGION:lambda:path/2015-03-31/functions/arn:aws:lambda:$REGION:000000000000:function:auth-handler/invocations" 2>/dev/null || true

aws --endpoint-url=$LOCALSTACK_ENDPOINT --region=$REGION apigateway put-integration \
    --rest-api-id $API_ID \
    --resource-id $AUTH_ID \
    --http-method OPTIONS \
    --type AWS_PROXY \
    --integration-http-method POST \
    --uri "arn:aws:apigateway:$REGION:lambda:path/2015-03-31/functions/arn:aws:lambda:$REGION:000000000000:function:auth-handler/invocations" 2>/dev/null || true

# Create /todos resource
TODOS_ID=$(aws --endpoint-url=$LOCALSTACK_ENDPOINT --region=$REGION apigateway create-resource \
    --rest-api-id $API_ID \
    --parent-id $ROOT_ID \
    --path-part todos \
    --query 'id' --output text 2>/dev/null || \
    aws --endpoint-url=$LOCALSTACK_ENDPOINT --region=$REGION apigateway get-resources \
        --rest-api-id $API_ID \
        --query "items[?pathPart=='todos'].id" --output text)

# Create methods for /todos (GET, POST, OPTIONS)
for METHOD in GET POST OPTIONS; do
    aws --endpoint-url=$LOCALSTACK_ENDPOINT --region=$REGION apigateway put-method \
        --rest-api-id $API_ID \
        --resource-id $TODOS_ID \
        --http-method $METHOD \
        --authorization-type NONE 2>/dev/null || true
    
    aws --endpoint-url=$LOCALSTACK_ENDPOINT --region=$REGION apigateway put-integration \
        --rest-api-id $API_ID \
        --resource-id $TODOS_ID \
        --http-method $METHOD \
        --type AWS_PROXY \
        --integration-http-method POST \
        --uri "arn:aws:apigateway:$REGION:lambda:path/2015-03-31/functions/arn:aws:lambda:$REGION:000000000000:function:todos-handler/invocations" 2>/dev/null || true
done

# Create /todos/{id} resource
TODOS_ITEM_ID=$(aws --endpoint-url=$LOCALSTACK_ENDPOINT --region=$REGION apigateway create-resource \
    --rest-api-id $API_ID \
    --parent-id $TODOS_ID \
    --path-part "{id}" \
    --query 'id' --output text 2>/dev/null || \
    aws --endpoint-url=$LOCALSTACK_ENDPOINT --region=$REGION apigateway get-resources \
        --rest-api-id $API_ID \
        --query "items[?pathPart=='{id}'].id" --output text)

# Create methods for /todos/{id} (PUT, DELETE, OPTIONS)
for METHOD in PUT DELETE OPTIONS; do
    aws --endpoint-url=$LOCALSTACK_ENDPOINT --region=$REGION apigateway put-method \
        --rest-api-id $API_ID \
        --resource-id $TODOS_ITEM_ID \
        --http-method $METHOD \
        --authorization-type NONE 2>/dev/null || true
    
    aws --endpoint-url=$LOCALSTACK_ENDPOINT --region=$REGION apigateway put-integration \
        --rest-api-id $API_ID \
        --resource-id $TODOS_ITEM_ID \
        --http-method $METHOD \
        --type AWS_PROXY \
        --integration-http-method POST \
        --uri "arn:aws:apigateway:$REGION:lambda:path/2015-03-31/functions/arn:aws:lambda:$REGION:000000000000:function:todos-handler/invocations" 2>/dev/null || true
done

# Deploy API
aws --endpoint-url=$LOCALSTACK_ENDPOINT --region=$REGION apigateway create-deployment \
    --rest-api-id $API_ID \
    --stage-name local

echo "✅ API Gateway created!"

# Clean up zip files
rm -f auth.zip todos.zip

# Save API ID for frontend
echo "$API_ID" > "$PROJECT_DIR/frontend/.api-id"

echo ""
echo "════════════════════════════════════════════════════════════════"
echo "🎉 DEPLOYMENT COMPLETE!"
echo "════════════════════════════════════════════════════════════════"
echo ""
echo "🌐 FRONTEND URL:  http://localhost:3000"
echo ""
echo "👤 TEST CREDENTIALS:"
echo "   Username: testuser"
echo "   Password: testpass"
echo ""
echo "📋 API Endpoints (LocalStack):"
echo "   Auth:  POST $LOCALSTACK_ENDPOINT/restapis/$API_ID/local/_user_request_/auth"
echo "   Todos: $LOCALSTACK_ENDPOINT/restapis/$API_ID/local/_user_request_/todos"
echo ""
echo "════════════════════════════════════════════════════════════════"
