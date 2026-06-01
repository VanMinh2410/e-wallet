# 🔀 Quy tắc: Git Workflow

## Branch Strategy (GitFlow đơn giản hóa)

```
main         ← production-ready, protected
  └── develop (tùy chọn)
        ├── feature/...
        ├── fix/...
        └── hotfix/...
```

## Branch Naming

```bash
feature/<scope>-<description>     # Tính năng mới
fix/<scope>-<description>         # Sửa bug thường
hotfix/<scope>-<description>      # Sửa bug khẩn trên production
refactor/<scope>-<description>    # Refactoring
chore/<description>               # Cấu hình, build tools
```

Ví dụ:
```
feature/wallet-qr-payment
fix/auth-token-expiry
hotfix/transfer-double-charge
refactor/transaction-service-cleanup
```

## Pull Request Rules

- **PR phải có ít nhất 1 approver** trước khi merge
- **PR không được merge nếu CI fail**
- **Squash merge** vào main (giữ history gọn)
- Xóa branch sau khi merge
- PR phải điền đầy đủ mẫu `templates/pr-template.md`

## Commit Rules

- Tuân theo `rules/commit-convention.md`
- **KHÔNG** commit file: `.env`, `node_modules/`, `dist/`, `*.log`
- **KHÔNG** commit với message không rõ ràng: "fix", "update", "test"
- Mỗi commit chỉ làm một việc cụ thể (atomic commit)

## .gitignore Bắt buộc

```gitignore
# Environment
.env
.env.local
.env.*.local
.claude/settings.local.json

# Dependencies
node_modules/

# Build
dist/
build/
.next/

# Logs
*.log
npm-debug.log*

# Testing
coverage/
.nyc_output/

# IDE
.idea/
.vscode/*
!.vscode/extensions.json

# OS
.DS_Store
Thumbs.db

# Docker volumes
mongo_data/
redis_data/
```

## Protected Branches

- `main`: chỉ merge qua PR, require CI pass, require review
- Không cho phép force push vào `main`
- Require linear history (squash merge)

## Release Tagging

```bash
# Semantic versioning: MAJOR.MINOR.PATCH
git tag v1.0.0 -m "Initial release"
git tag v1.1.0 -m "Add QR payment feature"
git tag v1.1.1 -m "Fix transfer double charge bug"
git push origin --tags
```
