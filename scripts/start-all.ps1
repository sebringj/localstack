$ErrorActionPreference = 'Stop'

$SCRIPT_DIR = Split-Path -Parent $MyInvocation.MyCommand.Path
$PROJECT_DIR = Split-Path -Parent $SCRIPT_DIR

Set-Location $PROJECT_DIR

Write-Host "🚀 Starting LocalStack..."

if ($env:LOCALSTACK_AUTH_TOKEN) {
    localstack auth set-token "$env:LOCALSTACK_AUTH_TOKEN"
}

localstack start -d

Write-Host "⏳ Waiting for LocalStack to be ready..."
localstack wait -t 60

Write-Host "✅ LocalStack is running!"

& "$SCRIPT_DIR/deploy.ps1"

Write-Host ""
Write-Host "✅ All local dependencies started!"
Write-Host ""
Write-Host "To start the frontend, run:"
Write-Host "   cd frontend; npm install; npm run dev"
