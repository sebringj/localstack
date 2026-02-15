#!/bin/bash

# Stop all local development dependencies

echo "🛑 Stopping LocalStack..."
LOCALSTACK_CMD="$(command -v localstack 2>/dev/null || echo /opt/homebrew/bin/localstack)"
"$LOCALSTACK_CMD" stop 2>/dev/null || true
echo "✅ LocalStack stopped!"
