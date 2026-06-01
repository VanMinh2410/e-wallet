# HKi Wallet (E-Wallet)

Ứng dụng ví điện tử nội bộ — nạp, rút, chuyển tiền, thanh toán QR, thông báo realtime.

## Cấu trúc

```
e-wallet/
├── backend/     # NestJS API (/api/v1)
├── frontend/    # React + Vite
├── docs/        # Tài liệu nghiệp vụ
├── .claude/     # Quy chuẩn AI codegen
└── scripts/     # Seed database
```

## Yêu cầu

- Node.js 18+
- Docker (MongoDB replica set + Redis)

## Chạy local

### 1. Infrastructure

```bash
docker compose up -d
```

Đợi MongoDB khởi tạo replica set `rs0` (khoảng 30 giây).

### 2. Backend

```bash
cd backend
cp .env.example .env
npm install
npm run start:dev
```

API: http://localhost:3000/api/v1  
Swagger: http://localhost:3000/api/docs

### 3. Seed dữ liệu test

Từ thư mục `backend/` (khuyến nghị):

```bash
cd backend
npm run seed
```

Hoặc từ thư mục gốc `e-wallet/`:

```bash
node scripts/seed-database.js
```

**Lưu ý:** Không dùng `node ../scripts/...` khi đang ở thư mục gốc — đường dẫn đó trỏ ra ngoài repo.

Tài khoản mẫu:

| Email | Mật khẩu | Role |
|-------|----------|------|
| admin@hki-wallet.dev | Admin@123456 | admin |
| usera@hki-wallet.dev | User@123456 | user |
| userb@hki-wallet.dev | User@123456 | user |

### 4. Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

UI: http://localhost:5173

## Tính năng MVP

- Đăng ký / đăng nhập / OTP / JWT refresh (HttpOnly cookie + Redis)
- Chuyển tiền P2P (MongoDB transaction, idempotency)
- Nạp tiền + webhook mô phỏng
- Rút tiền + admin duyệt
- Lịch sử giao dịch
- Thanh toán QR (HMAC)
- Socket.IO realtime (`/notifications`)
- Liên kết ngân hàng (mã hóa số TK)
- Admin dashboard

## Tài liệu

Xem [docs/README.md](docs/README.md) và [.claude/CLAUDE.md](.claude/CLAUDE.md).
