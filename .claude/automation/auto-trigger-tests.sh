#!/bin/bash
# auto-trigger-tests.sh – Kích hoạt test hàng loạt
# Dùng trong CI hoặc chạy thủ công trước khi release

set -e

PASS=0
FAIL=0
START_TIME=$(date +%s)

echo "🧪 HKi Wallet – Auto Test Runner"
echo "================================="
echo "Bắt đầu: $(date)"
echo ""

run_test() {
  local name="$1"
  local cmd="$2"
  local dir="${3:-.}"
  
  echo "▶ Chạy: $name"
  
  if (cd "$dir" && eval "$cmd" > /tmp/test-output.txt 2>&1); then
    echo "  ✅ PASS: $name"
    PASS=$((PASS + 1))
  else
    echo "  ❌ FAIL: $name"
    echo "  --- Output ---"
    cat /tmp/test-output.txt | head -30
    echo "  --- End ---"
    FAIL=$((FAIL + 1))
  fi
  echo ""
}

# Backend Tests
echo "=== BACKEND TESTS ==="
run_test "Backend Unit Tests" "npm run test -- --passWithNoTests" "apps/backend"
run_test "Backend Type Check" "npm run type-check" "apps/backend"
run_test "Backend Lint" "npm run lint" "apps/backend"

# Frontend Tests
echo "=== FRONTEND TESTS ==="
run_test "Frontend Unit Tests" "npm run test -- --watchAll=false --passWithNoTests" "apps/frontend"
run_test "Frontend Type Check" "npm run type-check" "apps/frontend"
run_test "Frontend Lint" "npm run lint" "apps/frontend"

# Validator Tests
echo "=== VALIDATORS ==="
run_test "Check Commit Convention" "node .claude/validators/check-commit-message.js 'feat(wallet): test message'" "."
run_test "Check Naming Convention" "node .claude/validators/check-naming-convention.js apps/" "."
run_test "Check API Convention" "node .claude/validators/check-api-convention.js apps/backend/src/" "."

# Tổng kết
END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

echo "================================="
echo "📊 Kết quả:"
echo "   ✅ PASS: $PASS"
echo "   ❌ FAIL: $FAIL"
echo "   ⏱️  Thời gian: ${DURATION}s"
echo ""

if [ "$FAIL" -gt 0 ]; then
  echo "❌ Có $FAIL test suite thất bại. KHÔNG deploy!"
  exit 1
else
  echo "✅ Tất cả test PASS! Sẵn sàng deploy."
  exit 0
fi
