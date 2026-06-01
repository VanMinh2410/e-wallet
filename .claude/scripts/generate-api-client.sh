#!/bin/bash
# generate-api-client.sh – Tạo API client từ OpenAPI/Swagger spec

set -e

API_URL="${API_URL:-http://localhost:3000/api/docs-json}"
OUTPUT_DIR="packages/api-client"
GENERATOR="typescript-axios"

echo "🔧 Tạo API client từ Swagger spec..."
echo "  URL: $API_URL"
echo "  Output: $OUTPUT_DIR"

# Kiểm tra openapi-generator-cli
if ! command -v openapi-generator-cli &> /dev/null; then
  echo "📦 Cài đặt openapi-generator-cli..."
  npm install -g @openapitools/openapi-generator-cli
fi

# Tải spec từ backend
echo "⬇️  Tải Swagger spec..."
curl -s "$API_URL" -o /tmp/hki-wallet-api.json

# Generate client
echo "⚙️  Generate TypeScript client..."
openapi-generator-cli generate \
  -i /tmp/hki-wallet-api.json \
  -g "$GENERATOR" \
  -o "$OUTPUT_DIR" \
  --additional-properties=supportsES6=true,withSeparateModelsAndApi=true

echo "✅ API client đã được tạo tại: $OUTPUT_DIR"
echo ""
echo "📌 Sử dụng trong frontend:"
echo "  import { WalletsApi } from '@hki/api-client';"
