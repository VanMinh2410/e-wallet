# E-Wallet Documentation

Tài liệu toàn bộ dự án E-Wallet - Ứng dụng quản lý ví điện tử

## 📑 Mục lục

1. [Tổng quan kiến trúc](./ARCHITECTURE.md)
2. [Tech Stack](./TECH_STACK.md)
3. [Phân chia giai đoạn phát triển](./PHASES.md)
4. [Lược đồ cơ sở dữ liệu](./DATABASE_SCHEMA.md)
5. [Đặc tả API](./API_SPEC.md)
6. [Timeline phát triển](./TIMELINE.md)
7. [Hướng dẫn Bảo mật](./SECURITY.md)
8. [Triển khai & DevOps](./DEPLOYMENT.md)

## 🎯 Mục tiêu dự án

Xây dựng một ứng dụng E-Wallet hoàn chỉnh cho phép:
- Quản lý ví tiền điện tử
- Chuyển tiền giữa các tài khoản
- Nạp/rút tiền từ ngân hàng
- Thanh toán QR code
- Quản lý hóa đơn & dịch vụ
- Quản trị & phân tích

## 🏗️ Cấu trúc thư mục

```
e-wallet/
├── docs/                    # Tài liệu
│   ├── README.md           # File này
│   ├── ARCHITECTURE.md      # Kiến trúc hệ thống
│   ├── TECH_STACK.md       # Công nghệ sử dụng
│   ├── PHASES.md           # Các giai đoạn
│   ├── DATABASE_SCHEMA.md  # Schema MongoDB
│   ├── API_SPEC.md         # Spec API
│   ├── TIMELINE.md         # Timeline
│   ├── SECURITY.md         # Bảo mật
│   └── DEPLOYMENT.md       # Deployment
├── backend/                 # Node.js + NestJS
├── frontend/                # React + TypeScript
└── docker-compose.yml       # Docker orchestration
```

## 📊 Thống kê dự án

- **Frameworks chính**: NestJS, React, MongoDB
- **Thời gian dự kiến**: 5-6 tháng
- **Số lượng API endpoints**: 50+
- **Số lượng collections MongoDB**: 8-10
- **Thành phố đích**: Hỗ trợ tất cả các ứng dụng e-wallet VN

## 🚀 Bắt đầu nhanh

Xem file [PHASES.md](./PHASES.md) để hiểu chi tiết từng giai đoạn phát triển.

## 📞 Liên hệ & Support

Cho bất kỳ câu hỏi nào về architecture hoặc implementation, tham khảo tài liệu tương ứng.
