# 🚀 Lệnh: Deploy

## Mô tả
Quy trình deploy HKi Wallet lên môi trường staging và production.

## Môi trường

| Môi trường | URL | Branch | Deploy |
|---|---|---|---|
| Development | localhost | bất kỳ | thủ công |
| Staging | staging.hki-wallet.com | main | tự động sau merge |
| Production | hki-wallet.com | main (tag) | thủ công + approval |

## Deploy lên Staging

### Tự động (qua GitHub Actions)
Mỗi khi merge PR vào `main`, GitHub Actions sẽ tự động:
1. Chạy test
2. Build Docker image
3. Push lên registry
4. Deploy lên staging
5. Chạy smoke test

### Thủ công
```bash
# Build image
docker build -t hki-wallet-backend:latest ./apps/backend
docker build -t hki-wallet-frontend:latest ./apps/frontend

# Push lên registry
docker push your-registry/hki-wallet-backend:latest
docker push your-registry/hki-wallet-frontend:latest

# Deploy (SSH vào server staging)
ssh user@staging-server
docker compose pull
docker compose up -d --no-deps backend frontend
```

## Deploy lên Production

### Điều kiện bắt buộc
- [ ] Tất cả test trên staging PASS
- [ ] Release note đã viết
- [ ] QA đã sign-off
- [ ] Backup database đã chạy
- [ ] Team lead đã approve

### Bước 1: Tạo Release Tag
```bash
git checkout main
git pull
git tag v1.2.0 -m "Release v1.2.0: Thêm tính năng QR payment"
git push origin v1.2.0
```

### Bước 2: Backup Database
```bash
# Chạy từ server production
mongodump --uri="mongodb://..." --out=/backup/$(date +%Y%m%d_%H%M%S)
```

### Bước 3: Deploy
```bash
# Trên server production
docker compose pull
docker compose up -d --no-deps backend
# Chờ health check PASS
sleep 30
docker compose up -d --no-deps frontend
```

### Bước 4: Smoke Test
```bash
# Kiểm tra API health
curl https://api.hki-wallet.com/health

# Kiểm tra các endpoint chính
curl -X POST https://api.hki-wallet.com/auth/login ...
```

### Bước 5: Monitoring sau Deploy
- Theo dõi error rate trên Grafana trong 30 phút đầu
- Kiểm tra log: `docker compose logs -f backend --tail=100`
- Alert nếu error rate > 1%

## Rollback

```bash
# Rollback về image cũ
docker compose down backend
docker compose run -d backend --image hki-wallet-backend:previous-tag

# Kiểm tra
curl https://api.hki-wallet.com/health
```
