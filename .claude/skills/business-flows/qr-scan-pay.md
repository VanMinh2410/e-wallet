# 📱 Business Flow: QR Scan & Pay

## Use Case: UC-04 – Quét QR để thanh toán

**Tác nhân**: Người mua (scanner) và Người bán (owner QR)
**Mục tiêu**: Thanh toán nhanh bằng cách quét QR

## Điều kiện Tiên quyết
- Cả 2 đều có tài khoản HKi
- Người mua có đủ số dư
- Người bán đã tạo QR code

## Luồng Chính

1. Người bán hiển thị QR code từ ứng dụng
2. Người mua mở camera trong ứng dụng HKi
3. Người mua quét QR → app parse dữ liệu
4. App gọi API verify QR → nhận thông tin người nhận
5. App hiển thị form nhập số tiền (người bán đã nhập sẵn hoặc người mua nhập)
6. Người mua xác nhận → thực hiện transfer (UC-02)
7. Cả 2 nhận thông báo

## Variant: QR có số tiền cố định

Người bán có thể tạo QR với số tiền cố định:
- QR payload có thêm `amount: 50000`
- Khi scan → hiển thị số tiền đã cố định (không sửa được)

## Business Rules

- QR code không có TTL (dùng mãi)
- QR có checksum HMAC để chống giả mạo
- Chuyển tiền từ QR giống chuyển tiền thường (áp dụng mọi giới hạn)

## Hậu điều kiện
- Transfer hoàn tất như UC-02
