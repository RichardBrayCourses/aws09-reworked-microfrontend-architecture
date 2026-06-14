#!/usr/bin/env bash
set -euo pipefail

BASE_URL=$(aws ssm get-parameter \
  --name /services/realtime-likes-service/base-url \
  --query 'Parameter.Value' \
  --output text)

HEALTH_URL="${BASE_URL%/}/public/health"

echo "Testing ${HEALTH_URL}"
RESPONSE=$(curl -sS "$HEALTH_URL")
echo "$RESPONSE"

echo "$RESPONSE" | grep -q '"status": "ok"'
echo "$RESPONSE" | grep -q '"service": "realtime-likes-service"'

echo "Realtime likes public API test passed."
