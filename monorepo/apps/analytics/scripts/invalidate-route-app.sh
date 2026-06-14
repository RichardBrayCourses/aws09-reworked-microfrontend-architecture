#!/usr/bin/env bash

set -euo pipefail

DISTRIBUTION_ID_PARAMETER="/website/distribution-id"
APP_PREFIX="analytics"

echo ""
echo "Reading CloudFront distribution ID from SSM Parameter Store..."
echo ""

DISTRIBUTION_ID=$(MSYS_NO_PATHCONV=1 aws ssm get-parameter \
  --name "$DISTRIBUTION_ID_PARAMETER" \
  --query "Parameter.Value" \
  --output text)

echo "Creating CloudFront invalidation for /$APP_PREFIX/*"
echo ""

MSYS_NO_PATHCONV=1 aws cloudfront create-invalidation \
  --distribution-id "$DISTRIBUTION_ID" \
  --paths "/$APP_PREFIX" "/$APP_PREFIX/*"

echo ""
echo "Invalidation requested."
echo ""
