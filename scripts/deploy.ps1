# LocalStack deployment script for Todo App
# This script sets up DynamoDB tables, Lambda functions, and API Gateway

$ErrorActionPreference = 'Stop'

$env:AWS_PAGER = ""

$LOCALSTACK_ENDPOINT = "http://localhost:4566"
$LAMBDA_LOCALSTACK_ENDPOINT = "http://host.docker.internal:4566"
$REGION = "us-east-1"
$SCRIPT_DIR = Split-Path -Parent $MyInvocation.MyCommand.Path
$PROJECT_DIR = Split-Path -Parent $SCRIPT_DIR

Write-Host "🚀 Deploying Todo App to LocalStack..."

Write-Host "⏳ Waiting for LocalStack to be ready..."
while ($true) {
    aws --endpoint-url=$LOCALSTACK_ENDPOINT --region=$REGION sts get-caller-identity *> $null
    if ($LASTEXITCODE -eq 0) { break }
    Start-Sleep -Seconds 2
}
Write-Host "✅ LocalStack is ready!"

Write-Host "📦 Creating DynamoDB tables..."

aws --endpoint-url=$LOCALSTACK_ENDPOINT --region=$REGION dynamodb create-table `
    --table-name users `
    --attribute-definitions AttributeName=username,AttributeType=S `
    --key-schema AttributeName=username,KeyType=HASH `
    --billing-mode PAY_PER_REQUEST 2>$null
if ($LASTEXITCODE -ne 0) { Write-Host "   Users table already exists" }

aws --endpoint-url=$LOCALSTACK_ENDPOINT --region=$REGION dynamodb create-table `
    --table-name todos `
    --attribute-definitions AttributeName=username,AttributeType=S AttributeName=todo_id,AttributeType=S `
    --key-schema AttributeName=username,KeyType=HASH AttributeName=todo_id,KeyType=RANGE `
    --billing-mode PAY_PER_REQUEST 2>$null
if ($LASTEXITCODE -ne 0) { Write-Host "   Todos table already exists" }

Write-Host "✅ DynamoDB tables created!"

Write-Host "👤 Creating test user..."
$bytes = [System.Text.Encoding]::UTF8.GetBytes("testpass")
$sha256 = [System.Security.Cryptography.SHA256]::Create()
$hashBytes = $sha256.ComputeHash($bytes)
$TEST_PASSWORD_HASH = -join ($hashBytes | ForEach-Object { $_.ToString("x2") })

$userItem = '{"username": {"S": "testuser"}, "password": {"S": "' + $TEST_PASSWORD_HASH + '"}}'
aws --endpoint-url=$LOCALSTACK_ENDPOINT --region=$REGION dynamodb put-item `
    --table-name users `
    --item $userItem *> $null
Write-Host "✅ Test user created (username: testuser, password: testpass)"

Write-Host "📦 Packaging Lambda functions..."

Set-Location "$PROJECT_DIR/backend"

if (Test-Path "auth.zip") { Remove-Item "auth.zip" -Force }
if (Test-Path "todos.zip") { Remove-Item "todos.zip" -Force }

Compress-Archive -Path "auth/handler.py" -DestinationPath "auth.zip" -Force
Compress-Archive -Path "todos/handler.py" -DestinationPath "todos.zip" -Force

Write-Host "✅ Lambda functions packaged!"

Write-Host "🔧 Creating Lambda functions..."

aws --endpoint-url=$LOCALSTACK_ENDPOINT --region=$REGION lambda create-function `
    --function-name auth-handler `
    --runtime python3.9 `
    --handler handler.handler `
    --zip-file fileb://auth.zip `
    --role arn:aws:iam::000000000000:role/lambda-role `
    --environment "Variables={LOCALSTACK_ENDPOINT=$LAMBDA_LOCALSTACK_ENDPOINT}" 2>$null
if ($LASTEXITCODE -ne 0) {
    aws --endpoint-url=$LOCALSTACK_ENDPOINT --region=$REGION lambda update-function-code `
        --function-name auth-handler `
        --zip-file fileb://auth.zip *> $null
}

aws --endpoint-url=$LOCALSTACK_ENDPOINT --region=$REGION lambda create-function `
    --function-name todos-handler `
    --runtime python3.9 `
    --handler handler.handler `
    --zip-file fileb://todos.zip `
    --role arn:aws:iam::000000000000:role/lambda-role `
    --environment "Variables={LOCALSTACK_ENDPOINT=$LAMBDA_LOCALSTACK_ENDPOINT}" 2>$null
if ($LASTEXITCODE -ne 0) {
    aws --endpoint-url=$LOCALSTACK_ENDPOINT --region=$REGION lambda update-function-code `
        --function-name todos-handler `
        --zip-file fileb://todos.zip *> $null
}

Write-Host "✅ Lambda functions created!"

Write-Host "🌐 Creating API Gateway..."

$API_ID = (aws --endpoint-url=$LOCALSTACK_ENDPOINT --region=$REGION apigateway create-rest-api `
    --name todoapi `
    --query id --output text 2>$null).Trim()

if (-not $API_ID) {
    $API_ID = (aws --endpoint-url=$LOCALSTACK_ENDPOINT --region=$REGION apigateway get-rest-apis `
        --query "items[?name=='todoapi'].id" --output text).Trim()
}

Write-Host "   API ID: $API_ID"

$ROOT_ID = (aws --endpoint-url=$LOCALSTACK_ENDPOINT --region=$REGION apigateway get-resources `
    --rest-api-id $API_ID `
    --query "items[?path=='/'].id" --output text).Trim()

Write-Host "   Root ID: $ROOT_ID"

$AUTH_ID = (aws --endpoint-url=$LOCALSTACK_ENDPOINT --region=$REGION apigateway create-resource `
    --rest-api-id $API_ID `
    --parent-id $ROOT_ID `
    --path-part auth `
    --query id --output text 2>$null).Trim()
if (-not $AUTH_ID) {
    $AUTH_ID = (aws --endpoint-url=$LOCALSTACK_ENDPOINT --region=$REGION apigateway get-resources `
        --rest-api-id $API_ID `
        --query "items[?pathPart=='auth'].id" --output text).Trim()
}

aws --endpoint-url=$LOCALSTACK_ENDPOINT --region=$REGION apigateway put-method --rest-api-id $API_ID --resource-id $AUTH_ID --http-method POST --authorization-type NONE 2>$null
aws --endpoint-url=$LOCALSTACK_ENDPOINT --region=$REGION apigateway put-method --rest-api-id $API_ID --resource-id $AUTH_ID --http-method OPTIONS --authorization-type NONE 2>$null

aws --endpoint-url=$LOCALSTACK_ENDPOINT --region=$REGION apigateway put-integration `
    --rest-api-id $API_ID `
    --resource-id $AUTH_ID `
    --http-method POST `
    --type AWS_PROXY `
    --integration-http-method POST `
    --uri "arn:aws:apigateway:$REGION:lambda:path/2015-03-31/functions/arn:aws:lambda:$REGION:000000000000:function:auth-handler/invocations" 2>$null

aws --endpoint-url=$LOCALSTACK_ENDPOINT --region=$REGION apigateway put-integration `
    --rest-api-id $API_ID `
    --resource-id $AUTH_ID `
    --http-method OPTIONS `
    --type AWS_PROXY `
    --integration-http-method POST `
    --uri "arn:aws:apigateway:$REGION:lambda:path/2015-03-31/functions/arn:aws:lambda:$REGION:000000000000:function:auth-handler/invocations" 2>$null

$TODOS_ID = (aws --endpoint-url=$LOCALSTACK_ENDPOINT --region=$REGION apigateway create-resource `
    --rest-api-id $API_ID `
    --parent-id $ROOT_ID `
    --path-part todos `
    --query id --output text 2>$null).Trim()
if (-not $TODOS_ID) {
    $TODOS_ID = (aws --endpoint-url=$LOCALSTACK_ENDPOINT --region=$REGION apigateway get-resources `
        --rest-api-id $API_ID `
        --query "items[?pathPart=='todos'].id" --output text).Trim()
}

$todoMethods = @("GET", "POST", "OPTIONS")
foreach ($METHOD in $todoMethods) {
    aws --endpoint-url=$LOCALSTACK_ENDPOINT --region=$REGION apigateway put-method `
        --rest-api-id $API_ID `
        --resource-id $TODOS_ID `
        --http-method $METHOD `
        --authorization-type NONE 2>$null

    aws --endpoint-url=$LOCALSTACK_ENDPOINT --region=$REGION apigateway put-integration `
        --rest-api-id $API_ID `
        --resource-id $TODOS_ID `
        --http-method $METHOD `
        --type AWS_PROXY `
        --integration-http-method POST `
        --uri "arn:aws:apigateway:$REGION:lambda:path/2015-03-31/functions/arn:aws:lambda:$REGION:000000000000:function:todos-handler/invocations" 2>$null
}

$TODOS_ITEM_ID = (aws --endpoint-url=$LOCALSTACK_ENDPOINT --region=$REGION apigateway create-resource `
    --rest-api-id $API_ID `
    --parent-id $TODOS_ID `
    --path-part "{id}" `
    --query id --output text 2>$null).Trim()
if (-not $TODOS_ITEM_ID) {
    $TODOS_ITEM_ID = (aws --endpoint-url=$LOCALSTACK_ENDPOINT --region=$REGION apigateway get-resources `
        --rest-api-id $API_ID `
        --query "items[?pathPart=='{id}'].id" --output text).Trim()
}

$itemMethods = @("PUT", "DELETE", "OPTIONS")
foreach ($METHOD in $itemMethods) {
    aws --endpoint-url=$LOCALSTACK_ENDPOINT --region=$REGION apigateway put-method `
        --rest-api-id $API_ID `
        --resource-id $TODOS_ITEM_ID `
        --http-method $METHOD `
        --authorization-type NONE 2>$null

    aws --endpoint-url=$LOCALSTACK_ENDPOINT --region=$REGION apigateway put-integration `
        --rest-api-id $API_ID `
        --resource-id $TODOS_ITEM_ID `
        --http-method $METHOD `
        --type AWS_PROXY `
        --integration-http-method POST `
        --uri "arn:aws:apigateway:$REGION:lambda:path/2015-03-31/functions/arn:aws:lambda:$REGION:000000000000:function:todos-handler/invocations" 2>$null
}

aws --endpoint-url=$LOCALSTACK_ENDPOINT --region=$REGION apigateway create-deployment --rest-api-id $API_ID --stage-name local *> $null

Write-Host "✅ API Gateway created!"

if (Test-Path "auth.zip") { Remove-Item "auth.zip" -Force }
if (Test-Path "todos.zip") { Remove-Item "todos.zip" -Force }

Set-Content -Path "$PROJECT_DIR/frontend/.api-id" -Value $API_ID -NoNewline

Write-Host ""
Write-Host "════════════════════════════════════════════════════════════════"
Write-Host "🎉 DEPLOYMENT COMPLETE!"
Write-Host "════════════════════════════════════════════════════════════════"
Write-Host ""
Write-Host "🌐 FRONTEND URL:  http://localhost:3000"
Write-Host ""
Write-Host "👤 TEST CREDENTIALS:"
Write-Host "   Username: testuser"
Write-Host "   Password: testpass"
Write-Host ""
Write-Host "📋 API Endpoints (LocalStack):"
Write-Host "   Auth:  POST $LOCALSTACK_ENDPOINT/restapis/$API_ID/local/_user_request_/auth"
Write-Host "   Todos: $LOCALSTACK_ENDPOINT/restapis/$API_ID/local/_user_request_/todos"
Write-Host ""
Write-Host "════════════════════════════════════════════════════════════════"
