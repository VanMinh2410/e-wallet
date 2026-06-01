# 🛠️ Lệnh: Cài đặt Môi trường Dev

## Mô tả
Quy trình cài đặt môi trường phát triển từ đầu cho dự án HKi Wallet.

## Điều kiện tiên quyết
- Node.js ≥ 18.0.0
- Docker Desktop đang chạy
- Git đã cấu hình

## Các Bước Thực Hiện

### Bước 1: Clone Repository
```bash
git clone https://github.com/your-org/hki-wallet.git
cd hki-wallet
```

### Bước 2: Cài đặt Dependencies
```bash
# Cài đặt dependencies cho toàn bộ monorepo
npm install

# Hoặc nếu dùng workspaces riêng biệt
cd apps/backend && npm install
cd ../frontend && npm install
```

### Bước 3: Cấu hình Biến Môi trường
```bash
# Copy file .env mẫu
cp apps/backend/.env.example apps/backend/.env
cp apps/frontend/.env.example apps/frontend/.env

# Chỉnh sửa các giá trị phù hợp (JWT_SECRET, SMTP, v.v.)
# Tối thiểu phải cấu hình:
# - JWT_ACCESS_SECRET
# - JWT_REFRESH_SECRET
# - MONGODB_URI (sẽ do docker cung cấp nếu dùng docker compose)
# - REDIS_URL (sẽ do docker cung cấp nếu dùng docker compose)
```

### Bước 4: Khởi động Docker Services
```bash
# Khởi động MongoDB + Redis + Mongo-init
docker compose up -d mongodb redis mongo-init

# Chờ MongoDB khởi động xong (khoảng 10-15 giây)
docker compose logs mongo-init

# Kiểm tra MongoDB replica set đã init chưa
docker exec -it hki-mongodb mongosh --eval "rs.status()"
```

### Bước 5: Seed Database
```bash
# Chạy script seed dữ liệu mẫu
node .claude/scripts/seed-database.js

# Hoặc dùng npm script nếu có
npm run db:seed
```

### Bước 6: Khởi động Ứng dụng
```bash
# Chạy backend (port 3000)
cd apps/backend && npm run start:dev

# Chạy frontend (port 5173) – terminal mới
cd apps/frontend && npm run dev
```

### Bước 7: Xác nhận
- Backend API: http://localhost:3000/api/health
- Frontend: http://localhost:5173
- API Docs (Swagger): http://localhost:3000/api/docs

## Xử lý Sự cố Thường gặp

| Vấn đề | Giải pháp |
|---|---|
| MongoDB không kết nối | Chạy lại `docker compose restart mongodb` và đợi thêm |
| Port 3000 đã dùng | `lsof -i :3000` để tìm process, kill hoặc đổi PORT trong .env |
| Redis connection refused | Kiểm tra `docker compose ps` xem redis đang chạy chưa |
| JWT_SECRET thiếu | Kiểm tra file `.env` đã có `JWT_ACCESS_SECRET` chưa |
