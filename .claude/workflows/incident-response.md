# 🚨 Workflow: Incident Response

## Phân loại Incident

| Cấp độ | Mô tả | SLA |
|---|---|---|
| P1 – Critical | Hệ thống down, mất tiền, bảo mật | 1 giờ |
| P2 – High | Tính năng chính không hoạt động | 4 giờ |
| P3 – Medium | Tính năng phụ lỗi | 24 giờ |

## Bước 1: Phát hiện (0-5 phút)

- Nhận alert từ Grafana / PagerDuty
- Hoặc báo cáo từ user / team
- Đánh giá cấp độ: P1, P2, hay P3

**Nếu P1 → thông báo ngay cho:**
1. Team Lead / Tech Lead
2. Channel #incidents trên Slack
3. Tắt các tính năng liên quan nếu có thể (feature flag)

## Bước 2: Phân tích (5-20 phút)

### Kiểm tra log
```bash
# Log backend
docker compose logs backend --tail=200 --since=30m

# Log với filter error
docker compose logs backend 2>&1 | grep ERROR

# MongoDB log
docker compose logs mongodb --tail=50
```

### Kiểm tra metrics
- Grafana: error rate, response time, transaction failure rate
- Redis: `redis-cli info stats`
- MongoDB: `db.currentOp()` – kiểm tra long-running queries

### Kiểm tra queue
```bash
# Số job đang fail
# Mở Bull Board: /admin/queues
```

### Câu hỏi cần trả lời
1. Incident bắt đầu lúc nào? (kiểm tra log timestamp)
2. Ảnh hưởng đến tính năng nào? (transfer, topup, login?)
3. Ảnh hưởng đến bao nhiêu user?
4. Code nào đã deploy gần đây nhất?
5. Có thay đổi infra không? (scale, restart, config change)

## Bước 3: Khắc phục (20-60 phút)

### Option A: Rollback (nếu do deploy mới)
```bash
# Rollback nhanh
docker compose up -d --no-deps backend hki-wallet-backend:v1.1.9
# Kiểm tra ngay
curl https://api.hki-wallet.com/health
```

### Option B: Hotfix
```bash
# Tạo hotfix branch từ main
git checkout -b hotfix/transfer-double-charge main

# Sửa code
# Viết test verify fix
# Code review nhanh (ít nhất 1 người)

git commit -m "hotfix(transfer): prevent double charge on retry"
git push origin hotfix/transfer-double-charge
# Merge sau review
```

### Option C: Tắt tính năng
Nếu cần thời gian fix dài → disable tính năng qua feature flag:
```typescript
// Tắt chuyển khoản tạm thời
if (!featureFlag.isEnabled('TRANSFER')) {
  throw new ServiceUnavailableException('Chức năng tạm thời không khả dụng');
}
```

## Bước 4: Xác minh Fix

```bash
# Kiểm tra health
curl https://api.hki-wallet.com/health

# Test giao dịch thử (test account)
# Theo dõi Grafana 15 phút

# Kiểm tra không còn error mới
docker compose logs backend --since=5m | grep ERROR
```

## Bước 5: Post-Mortem (trong 24h)

Viết báo cáo gồm:
1. **Timeline**: diễn biến từ lúc phát hiện đến khi fix
2. **Root Cause**: nguyên nhân gốc rễ
3. **Impact**: ảnh hưởng đến user, số transaction bị ảnh hưởng
4. **Fix**: giải pháp đã áp dụng
5. **Prevention**: làm gì để không lặp lại?
   - Thêm test case
   - Thêm monitoring/alerting
   - Cải thiện quy trình

Lưu vào `context/decisions.md` và `context/known-bugs.md`.

## Checklist P1 Incident

- [ ] Thông báo team ngay lập tức
- [ ] Đánh giá rollback hay hotfix
- [ ] Không làm nhiều thay đổi cùng lúc
- [ ] Document mọi hành động và thời gian
- [ ] Thông báo stakeholder về tình trạng (mỗi 30 phút)
- [ ] Xác minh fix trước khi thông báo resolved
- [ ] Viết post-mortem trong 24h
