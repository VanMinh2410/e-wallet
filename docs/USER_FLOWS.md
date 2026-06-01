# User Flows — HKi Wallet

Chi tiết các luồng người dùng đã được triển khai trong hệ thống.

---

## 1. Đăng Ký & Xác Thực Email

```
[Nhập form] → [POST /auth/register] → [Tạo user + ví]
     ↓
[Gửi OTP email] → [Nhập OTP 6 số] → [POST /auth/verify-otp]
     ↓
[isVerified = true] → [Redirect đăng nhập]
```

**Chi tiết:**
- OTP 6 chữ số, hiệu lực 10 phút, lưu MongoDB
- Nếu SMTP chưa config → trả `devOtp` trong response (dev mode)
- Email template: gradient xanh dương, OTP box 42px
- OTP Modal: 6 ô tách biệt, auto-focus, paste support

---

## 2. Đăng Nhập

```
[Email + Password] → [POST /auth/login]
     ↓
[JWT Access Token 15m] + [Refresh Token 7d → Redis]
     ↓
[Lưu localStorage] → [Dashboard]
```

---

## 3. Nạp Tiền (Deposit)

```
Step 1: Nhập số tiền (≥10K, ≤50M) + chọn quick amount
     ↓
[POST /transactions/deposit] → [Tạo TX PENDING + paymentCode]
     ↓
Step 2: Hiển thị bank info + QR chuyển khoản
        Countdown 15 phút
     ↓
[Người dùng chuyển khoản thực]
     ↓
[POST /transactions/webhooks/payment] (webhook confirm)
     ↓
[Cộng số dư ví] + [TX → SUCCESS] + [Notification]
     ↓
Step 3: Thành công
```

**Chi tiết:**
- Idempotency key: chống duplicate webhook qua Redis
- Socket.IO emit `balance:updated` sau khi cộng tiền
- Email: không gửi email cho flow này

---

## 4. Chuyển Tiền — Ví HKi (P2P Transfer)

```
Step 1: Nhập email/SĐT người nhận + số tiền + lời nhắn
     ↓
Step 2: Xác nhận thông tin
     ↓
[Nếu ≥ 500.000đ] → OTP Modal → Nhập OTP
     ↓
[POST /wallets/:id/transfers] (kèm Idempotency-Key header)
     ↓
[MongoDB Transaction: trừ sender + cộng receiver]
     ↓
Step 3: Thành công + mã reference
```

**OTP Flow:**
1. Click "Xác nhận & OTP" → `POST /auth/transaction-otp/send`
2. Backend: lưu OTP vào MongoDB (TTL 10 phút), gửi email gradient xanh lá
3. Frontend: OTP Modal 6 ô, countdown 2 phút
4. `POST /auth/transaction-otp/verify` → lưu Redis `txotp:{userId}` 5 phút
5. Execute transfer (backend kiểm tra Redis key)

---

## 5. Chuyển Tiền — Ngân Hàng (Bank Transfer)

```
Step 1: Chọn tài khoản đã lưu HOẶC nhập ngân hàng + STK mới
        Nhập số tiền + nội dung
     ↓
Step 2: Xác nhận (bank name, STK, chủ TK, số tiền, phí)
     ↓
[Nếu ≥ 500.000đ] → OTP Modal → Nhập OTP
     ↓
[POST /transactions/bank-transfer]
     ↓
[TX → PROCESSING] (1–2 ngày làm việc)
     ↓
Step 3: Thành công (đang xử lý)
```

---

## 6. Rút Tiền (Withdraw)

```
Step 1: Chọn ngân hàng liên kết + nhập số tiền
        Quick amount chips: 100K, 200K, 500K, 1M, 2M
     ↓
Step 2: Xác nhận (bank, STK, số tiền, phí, trạng thái)
     ↓
[Nếu ≥ 100.000đ] → OTP Modal → Nhập OTP
     ↓
[POST /transactions/withdraw]
     ↓
[TX → PENDING] (chờ admin duyệt)
     ↓
Step 3: "Yêu cầu đã gửi" + mã reference
```

**Admin approval:**
```
Admin tab "Rút tiền" → Danh sách PENDING
     ↓
[Duyệt] → TX SUCCESS + Email notify user
[Từ chối] → Hoàn tiền vào ví + TX CANCELLED + Notify
```

---

## 7. Thanh Toán QR

### Tạo QR Nhận Tiền
```
Nhập số tiền cố định (tùy chọn)
     ↓
[GET /qr/generate?amount=X]
     ↓
QR = base64(JSON{payload: {merchantEmail, amount}, sig: HMAC-SHA256})
     ↓
Hiển thị QR với logo overlay
Download SVG / Copy / Share
```

### Quét QR Thanh Toán
```
Camera scan QR HOẶC paste text
     ↓
[POST /transactions/qr-payment] {walletId, qrData, amount?}
     ↓
Backend: verify HMAC sig → parse merchantEmail
         → tìm người nhận → MongoDB TX
         → trừ người gửi + cộng người nhận
     ↓
Thành công + số dư mới
```

---

## 8. Lịch Sử Giao Dịch

```
Dashboard → "Xem tất cả" → HistoryPage
     ↓
Filter theo loại (Tất cả / Chuyển / Nạp / Rút / QR)
     ↓
[GET /transactions?page=1&limit=20&type=X]
     ↓
Danh sách (skeleton loading → list)
     ↓
Click item → Detail Modal (loại, số tiền, trạng thái, mã GD, thời gian)
Copy mã giao dịch
```

---

## 9. Admin Dashboard

```
Login với role=admin → Profile → "Quản trị hệ thống"
     ↓
4 tabs:
```

### Tab Tổng Quan
- Stats: Người dùng / GD thành công / Rút chờ duyệt
- Revenue: Tổng nạp vào vs Tổng rút ra
- Alert banner nếu có pending withdrawals

### Tab Người Dùng
```
[GET /admin/users?search=&page=1&limit=15]
     ↓
Table: Tên + email | Role | Trạng thái | Ban/Unban
Search theo tên/email/SĐT
[POST /admin/users/:id/ban] hoặc [/unban]
```

### Tab Giao Dịch
```
[GET /admin/transactions?type=&status=&page=1]
     ↓
Table: Mã GD | Loại | Số tiền | Trạng thái | Thời gian
Filter theo type và status
```

### Tab Rút Tiền
```
[GET /admin/pending-approval]
     ↓
Danh sách cards (số tiền + ref + thời gian)
[Duyệt] → POST /admin/transactions/:id/approve {approve: true}
[Từ chối] → POST /admin/transactions/:id/approve {approve: false}
     ↓
Notify user qua Socket.IO + (tương lai: email)
```

---

## 10. OTP Email Template

3 loại email với màu riêng:

| Loại | Màu gradient | Subject |
|---|---|---|
| Xác minh email | Xanh dương `#1a56db` | ✅ Xác minh tài khoản HKi Wallet |
| Reset mật khẩu | Tím `#7e3af2` | 🔐 Đặt lại mật khẩu HKi Wallet |
| Xác thực GD | Xanh lá `#057a55` | 🔒 Xác thực giao dịch HKi Wallet |

Nội dung email gồm:
- Header gradient + logo HKi Wallet
- OTP box: 42px, letter-spacing 10px
- Info box: hướng dẫn sử dụng
- Security notice: không chia sẻ OTP
- Footer: disclaimer

---

## Notes Kỹ Thuật

- **Idempotency**: Transfer dùng `X-Idempotency-Key` header (UUID)
- **Redis keys**: `txotp:{userId}` (5 min), `rt:{userId}` (7d), `webhook:{ref}` (24h)
- **MongoDB transactions**: tất cả balance updates trong session
- **Socket.IO rooms**: `user:{userId}` cho real-time notifications
- **Audit log**: ghi mọi action quan trọng (TOPUP, WITHDRAW, TRANSFER, APPROVE)