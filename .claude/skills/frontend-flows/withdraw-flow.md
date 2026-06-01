# 💰 Frontend Flow: Rút tiền

## Màn hình: `/withdraw`

## Luồng

```
Step 1: Nhập thông tin
  → Số tiền cần rút
  → Tài khoản ngân hàng (đã lưu hoặc nhập mới)
  → Xác nhận số dư đủ

Step 2: Xác nhận
  → Hiển thị tóm tắt: ngân hàng, số tài khoản, số tiền, phí
  → Nhấn "Xác nhận rút"

Step 3: Chờ xử lý
  → Trạng thái PENDING
  → Thông báo "Đang xử lý, vui lòng chờ"
  → Nhận thông báo khi hoàn thành
```

## API

```typescript
// POST /api/v1/wallets/me/withdraw
// Body: { amount, bankAccountId }
// Response: { transactionId, status: 'PENDING' }
// → Job vào BullMQ, xử lý async
```

## Lưu ý

- Rút tiền xử lý async, không phải realtime
- Thông báo qua socket khi hoàn thành
- Giới hạn: 1 lần rút/ngày (tùy cấu hình)
- Số tiền tối thiểu: 50.000đ
- Thời gian xử lý: 1-3 ngày làm việc
