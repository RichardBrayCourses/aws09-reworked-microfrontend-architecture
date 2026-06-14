#!/usr/bin/env bash

set -euo pipefail

WEBSITE_BUCKET_NAME_PARAMETER="/website/bucket-name"
APP_PREFIX="analytics"
APP_DIST_DIR="dist"

echo ""
echo "Reading website bucket name from SSM Parameter Store..."
echo ""

WEBSITE_BUCKET_NAME=$(MSYS_NO_PATHCONV=1 aws ssm get-parameter \
  --name "$WEBSITE_BUCKET_NAME_PARAMETER" \
  --query "Parameter.Value" \
  --output text)

echo "Uploading $APP_DIST_DIR to s3://$WEBSITE_BUCKET_NAME/$APP_PREFIX"
echo ""

aws s3 sync "$APP_DIST_DIR" "s3://$WEBSITE_BUCKET_NAME/$APP_PREFIX" --delete

echo ""
echo "Upload complete."
echo ""
