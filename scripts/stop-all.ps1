Write-Host "🛑 Stopping LocalStack..."
try {
    localstack stop *> $null
} catch {
    # ignore if already stopped
}
Write-Host "✅ LocalStack stopped!"
