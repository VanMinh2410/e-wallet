#!/bin/bash
# pre-commit-ai.sh – Hook chạy trước khi commit
# Cài đặt: cp .claude/hooks/pre-commit-ai.sh .git/hooks/pre-commit && chmod +x .git/hooks/pre-commit

echo "🔍 Đang kiểm tra trước khi commit..."

# 1. Chạy validate-rules
if [ -f ".claude/scripts/validate-rules.sh" ]; then
  bash .claude/scripts/validate-rules.sh
  if [ $? -ne 0 ]; then
    echo "❌ Commit bị từ chối: Vi phạm quy tắc dự án."
    echo "   Xem lại .claude/rules/ để biết quy tắc."
    exit 1
  fi
fi

# 2. Kiểm tra commit message (lấy từ COMMIT_EDITMSG nếu có)
COMMIT_MSG_FILE=".git/COMMIT_EDITMSG"
if [ -f "$COMMIT_MSG_FILE" ]; then
  node .claude/validators/check-commit-message.js "$(cat $COMMIT_MSG_FILE)"
  if [ $? -ne 0 ]; then
    echo "❌ Commit message không đúng chuẩn. Xem: .claude/rules/commit-convention.md"
    exit 1
  fi
fi

# 3. Kiểm tra không commit file nhạy cảm
STAGED_FILES=$(git diff --cached --name-only)
for file in $STAGED_FILES; do
  if [[ "$file" == ".env" || "$file" == "*.pem" || "$file" == "*.key" ]]; then
    echo "❌ Phát hiện file nhạy cảm trong commit: $file"
    echo "   Vui lòng thêm vào .gitignore và không commit."
    exit 1
  fi
done

# 4. Chạy lint nhanh (chỉ file đang staged)
echo "🔧 Chạy ESLint trên các file thay đổi..."
npx eslint $(git diff --cached --name-only --diff-filter=ACM | grep -E '\\.(ts|tsx|js)$') --quiet
if [ $? -ne 0 ]; then
  echo "❌ ESLint phát hiện lỗi. Vui lòng sửa trước khi commit."
  exit 1
fi

echo "✅ Pre-commit checks passed. Commit thành công!"
exit 0
