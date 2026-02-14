#!/bin/bash

# Stop all local development dependencies

echo "🛑 Stopping LocalStack..."
localstack stop 2>/dev/null || true
echo "✅ LocalStack stopped!"
