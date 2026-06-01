# 🚀 Workflow: Release Process

## Tổng quan
Quy trình từ khi code sẵn sàng đến khi deploy lên production.

## Giai đoạn 1: Chuẩn bị Release (T-3 ngày)

### 1.1 Code Freeze
- Không merge tính năng mới vào main
- Chỉ chấp nhận bug fix và performance improvement
- Thông báo team

### 1.2 Chạy Full Test Suite
```bash
# Backend
cd apps/backend
npm run test:cov      # Unit + coverage
npm run test:e2e      # Integration

# Frontend
cd apps/frontend
npm run test          # Unit
npm run cypress:run   # E2E

# Load test
k6 run .claude/scripts/load-test-transfer.js
```

### 1.3 Kiểm tra Coverage
- Backend services: ≥ 85% (theo `rules/testing.md`)
- Nếu không đạt → viết thêm test, không release

## Giai đoạn 2: Staging Deploy (T-2 ngày)

### 2.1 Tạo Release Branch
```bash
git checkout -b release/v1.2.0 main
git push origin release/v1.2.0
```

### 2.2 Deploy lên Staging
Tự động qua GitHub Actions khi push release branch.

### 2.3 Smoke Test Staging
```bash
# Kiểm tra health
curl https://api-staging.hki-wallet.com/health

# Test các flow chính
# 1. Đăng nhập
# 2. Xem balance
# 3. Chuyển 1000đ (test account)
# 4. Kiểm tra lịch sử
# 5. Kiểm tra socket notification
```

### 2.4 QA Sign-off
- QA test thủ công các flow quan trọng
- Điền vào QA Checklist
- Sign-off bằng comment trên PR

## Giai đoạn 3: Chuẩn bị Production (T-1 ngày)

### 3.1 Viết Release Notes
```markdown
## v1.2.0 – 2025-01-15

### Tính năng mới
- Thanh toán bằng QR Code
- Hiển thị lịch sử theo tháng

### Sửa lỗi
- Fix #87: Refresh token không hoạt động sau 7 ngày

### Breaking Changes
- Không có
```

### 3.2 Database Migration (nếu có)
```bash
# Chạy migration script trước deploy
node scripts/migrate-v1.2.0.js --dry-run   # Test trước
node scripts/migrate-v1.2.0.js --execute   # Thực hiện
```

### 3.3 Backup Database Production
```bash
mongodump --uri="${PROD_MONGO_URI}" --out=/backup/pre-release-v1.2.0
```

## Giai đoạn 4: Production Deploy (T-0)

### 4.1 Tạo Tag
```bash
git checkout main
git merge release/v1.2.0
git tag v1.2.0 -m "Release v1.2.0"
git push origin main --tags
```

### 4.2 Deploy (GitHub Actions hoặc thủ công)
```bash
# SSH vào production server
ssh prod-server

# Pull image mới
docker compose pull

# Deploy backend trước
docker compose up -d --no-deps backend
sleep 30
curl https://api.hki-wallet.com/health  # Kiểm tra

# Deploy frontend
docker compose up -d --no-deps frontend
```

### 4.3 Monitoring 30 phút đầu
- Theo dõi error rate trên Grafana
- Đọc log: `docker compose logs -f backend --tail=50`
- Alert nếu error rate > 0.5%

## Giai đoạn 5: Post-Release

- Thông báo release cho stakeholder
- Xóa release branch
- Cập nhật CHANGELOG.md
- Lên kế hoạch sprint tiếp theo

## Rollback Plan

Nếu phát hiện bug nghiêm trọng trong 1 giờ đầu:
```bash
# Rollback về image trước
docker compose down backend
docker run -d --name backend-v1.1.9 hki-wallet-backend:v1.1.9
```

Sau đó theo quy trình `workflows/incident-response.md`.
