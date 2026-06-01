#!/bin/bash
# pre-ai-generate.sh – Kiểm tra môi trường trước khi AI sinh code

echo "🤖 Kiểm tra môi trường trước khi AI generate code..."

ERRORS=0

# 1. Kiểm tra đang ở đúng project
if [ ! -f "package.json" ] || ! grep -q "hki-wallet" package.json 2>/dev/null; then
  echo "⚠️  Cảnh báo: Có thể không đang ở thư mục gốc dự án HKi Wallet"
fi

# 2. Kiểm tra .env đã được cấu hình
if [ ! -f "apps/backend/.env" ]; then
  echo "⚠️  apps/backend/.env chưa tồn tại. Chạy setup trước: bash .claude/scripts/setup-dev-env.sh"
  ERRORS=$((ERRORS + 1))
fi

# 3. Kiểm tra Docker đang chạy (cho DB operations)
if ! docker info &> /dev/null; then
  echo "⚠️  Docker chưa chạy. Một số tính năng có thể không hoạt động."
fi

# 4. Kiểm tra rules/ tồn tại
if [ ! -d ".claude/rules" ]; then
  echo "❌ Thư mục .claude/rules không tồn tại!"
  ERRORS=$((ERRORS + 1))
fi

# 5. Nhắc nhở đọc rules
echo ""
echo "📚 Nhắc nhở: Trước khi sinh code, hãy đọc:"
echo "  - .claude/rules/code-style.md"
echo "  - .claude/rules/naming-conventions.md"
echo "  - .claude/rules/security.md (nếu liên quan đến auth/payment)"
echo "  - .claude/rules/database.md (nếu liên quan đến transaction)"

if [ $ERRORS -gt 0 ]; then
  echo ""
  echo "⚠️  Có $ERRORS cảnh báo. Nên giải quyết trước khi tiếp tục."
else
  echo ""
  echo "✅ Môi trường sẵn sàng!"
fi

exit 0
