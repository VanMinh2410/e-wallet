#!/bin/bash
# setup-dev-env.sh – Cài đặt môi trường phát triển HKi Wallet

set -e  # Dừng nếu có lỗi

echo "🚀 Bắt đầu cài đặt môi trường dev HKi Wallet..."
echo "================================================"

# 1. Kiểm tra các tool cần thiết
echo "📋 Kiểm tra dependencies..."

check_command() {
  if ! command -v "$1" &> /dev/null; then
    echo "❌ $1 chưa được cài đặt. Vui lòng cài đặt trước."
    exit 1
  else
    echo "✅ $1 đã sẵn sàng ($(\"$1\" --version 2>&1 | head -n1))"
  fi
}

check_command node
check_command npm
check_command docker
check_command docker-compose

# Kiểm tra Node.js version
NODE_VERSION=$(node -v | cut -d. -f1 | tr -d 'v')
if [ "$NODE_VERSION" -lt 18 ]; then
  echo "❌ Node.js phải >= 18. Hiện tại: $(node -v)"
  exit 1
fi

# 2. Kiểm tra Docker đang chạy
echo ""
echo "🐳 Kiểm tra Docker..."
if ! docker info &> /dev/null; then
  echo "❌ Docker chưa khởi động. Vui lòng khởi động Docker Desktop."
  exit 1
fi
echo "✅ Docker đang chạy"

# 3. Cài đặt dependencies
echo ""
echo "📦 Cài đặt Node.js dependencies..."
npm install
echo "✅ Dependencies đã cài đặt"

# 4. Tạo file .env
echo ""
echo "⚙️ Tạo file .env..."
if [ ! -f apps/backend/.env ]; then
  cp apps/backend/.env.example apps/backend/.env
  echo "✅ Đã tạo apps/backend/.env từ .env.example"
  echo "⚠️  Vui lòng chỉnh sửa apps/backend/.env với thông tin thực tế"
else
  echo "ℹ️  apps/backend/.env đã tồn tại, bỏ qua"
fi

if [ ! -f apps/frontend/.env ]; then
  cp apps/frontend/.env.example apps/frontend/.env
  echo "✅ Đã tạo apps/frontend/.env từ .env.example"
else
  echo "ℹ️  apps/frontend/.env đã tồn tại, bỏ qua"
fi

# 5. Khởi động Docker services
echo ""
echo "🐳 Khởi động MongoDB và Redis..."
docker-compose up -d mongodb redis

echo "⏳ Chờ MongoDB khởi động (15 giây)..."
sleep 15

# 6. Init MongoDB Replica Set
echo ""
echo "🔧 Khởi tạo MongoDB Replica Set..."
docker-compose up -d mongo-init
sleep 5

# Kiểm tra replica set
RS_STATUS=$(docker exec hki-mongodb mongosh --quiet --eval "rs.status().ok" 2>/dev/null || echo "0")
if [ "$RS_STATUS" == "1" ]; then
  echo "✅ MongoDB Replica Set đã sẵn sàng"
else
  echo "⚠️  Replica Set có thể chưa sẵn sàng. Chạy: docker exec hki-mongodb mongosh --eval 'rs.status()'"
fi

# 7. Seed database
echo ""
echo "🌱 Seed dữ liệu mẫu..."
if [ -f .claude/scripts/seed-database.js ]; then
  node .claude/scripts/seed-database.js
  echo "✅ Seed hoàn thành"
fi

echo ""
echo "================================================"
echo "✅ Cài đặt hoàn tất!"
echo ""
echo "📌 Các bước tiếp theo:"
echo "  1. Chỉnh sửa apps/backend/.env (JWT_SECRET, v.v.)"
echo "  2. Chạy: cd apps/backend && npm run start:dev"
echo "  3. Chạy: cd apps/frontend && npm run dev"
echo ""
echo "🔗 Truy cập:"
echo "  Backend:  http://localhost:3000"
echo "  Frontend: http://localhost:5173"
echo "  API Docs: http://localhost:3000/api/docs"
