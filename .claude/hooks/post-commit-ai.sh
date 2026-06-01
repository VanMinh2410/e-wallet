#!/bin/bash
# post-commit-ai.sh – Hook chạy sau khi commit thành công
# Cài đặt: cp .claude/hooks/post-commit-ai.sh .git/hooks/post-commit && chmod +x .git/hooks/post-commit

COMMIT_HASH=$(git rev-parse --short HEAD)
COMMIT_MSG=$(git log -1 --pretty=%s)
BRANCH=$(git rev-parse --abbrev-ref HEAD)

echo ""
echo "✅ Commit thành công!"
echo "   Branch: $BRANCH"
echo "   Hash: $COMMIT_HASH"
echo "   Message: $COMMIT_MSG"
echo ""

# Gợi ý bước tiếp theo
if [[ "$BRANCH" == feature/* ]]; then
  echo "📌 Tiếp theo:"
  echo "  - Chạy test: npm run test"
  echo "  - Khi sẵn sàng: git push origin $BRANCH"
  echo "  - Tạo PR theo mẫu: .claude/templates/pr-template.md"
elif [[ "$BRANCH" == hotfix/* ]]; then
  echo "🚨 Hotfix branch – nhớ:"
  echo "  - Verify fix đã hoạt động"
  echo "  - Push và tạo PR ngay"
  echo "  - Theo quy trình: .claude/workflows/incident-response.md"
fi

echo ""
