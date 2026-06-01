#!/bin/bash
# validate-rules.sh – Chạy tất cả validator để kiểm tra tuân thủ quy tắc

set -e

VALIDATOR_DIR=".claude/validators"
PASS_COUNT=0
FAIL_COUNT=0

echo "🔍 Bắt đầu kiểm tra tuân thủ quy tắc dự án HKi Wallet..."
echo "============================================================"

run_validator() {
  local name="$1"
  local cmd="$2"
  
  echo ""
  echo "▶ Chạy: $name"
  
  if eval "$cmd"; then
    echo "  ✅ PASS: $name"
    PASS_COUNT=$((PASS_COUNT + 1))
  else
    echo "  ❌ FAIL: $name"
    FAIL_COUNT=$((FAIL_COUNT + 1))
  fi
}

# Chạy các validator
run_validator "Commit Message Convention" \
  "node $VALIDATOR_DIR/check-commit-message.js"

run_validator "Naming Convention" \
  "node $VALIDATOR_DIR/check-naming-convention.js"

run_validator "API Convention" \
  "node $VALIDATOR_DIR/check-api-convention.js"

# Chạy ESLint
echo ""
echo "▶ Chạy: ESLint"
if npm run lint --if-present; then
  echo "  ✅ PASS: ESLint"
  PASS_COUNT=$((PASS_COUNT + 1))
else
  echo "  ❌ FAIL: ESLint"
  FAIL_COUNT=$((FAIL_COUNT + 1))
fi

# Chạy TypeScript check
echo ""
echo "▶ Chạy: TypeScript Type Check"
if npm run type-check --if-present; then
  echo "  ✅ PASS: TypeScript"
  PASS_COUNT=$((PASS_COUNT + 1))
else
  echo "  ❌ FAIL: TypeScript"
  FAIL_COUNT=$((FAIL_COUNT + 1))
fi

# Tổng kết
echo ""
echo "============================================================"
echo "📊 Kết quả: $PASS_COUNT PASS | $FAIL_COUNT FAIL"

if [ "$FAIL_COUNT" -gt 0 ]; then
  echo "❌ Có $FAIL_COUNT validator thất bại. Vui lòng sửa trước khi commit."
  exit 1
else
  echo "✅ Tất cả validator PASS!"
fi
