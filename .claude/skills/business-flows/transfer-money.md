# 💸 Business Flow: Chuyển tiền

## Use Case: UC-02 – Chuyển tiền giữa 2 ví HKi

**Tác nhân**: Người dùng đã đăng nhập và có ví
**Mục tiêu**: Chuyển một khoản tiền từ ví mình sang ví người khác

## Điều kiện Tiên quyết
- Người gửi đã đăng nhập (access token hợp lệ)
- Người gửi đã xác minh tài khoản (isVerified: true)
- Ví người gửi đang hoạt động (isActive: true)
- Ví người nhận tồn tại và đang hoạt động

## Luồng Chính

1. Người gửi nhập thông tin: số điện thoại/email người nhận, số tiền, ghi chú
2. Hệ thống tìm kiếm và hiển thị thông tin người nhận
3. Người gửi xác nhận thông tin
4. Hệ thống kiểm tra idempotency (reference key)
5. Hệ thống kiểm tra rate limit
6. Hệ thống mở MongoDB Transaction:
   - Kiểm tra balance người gửi >= số tiền
   - Trừ tiền người gửi
   - Cộng tiền người nhận
   - Tạo bản ghi giao dịch
   - Commit
7. Hệ thống thông báo realtime cho cả 2 bên (Socket.IO)
8. Hệ thống gửi thông báo (notification queue)
9. Trả về kết quả thành công

## Luồng Ngoại lệ

### E1: Số dư không đủ
- HTTP 400, code: INSUFFICIENT_BALANCE
- Thông báo số dư hiện tại và số tiền thiếu

### E2: Người nhận không tìm thấy
- HTTP 404, code: USER_NOT_FOUND

### E3: Chuyển cho chính mình
- HTTP 400, code: SELF_TRANSFER_NOT_ALLOWED

### E4: Rate limit vượt quá
- HTTP 429, thông báo thời gian chờ

### E5: Transaction lỗi (DB failure)
- Tự động rollback
- Không trừ tiền người gửi
- HTTP 500, thông báo thân thiện

## Business Rules

| Rule | Giá trị |
|---|---|
| Số tiền tối thiểu | 1.000 VNĐ |
| Số tiền tối đa/giao dịch | 100.000.000 VNĐ |
| Số lần chuyển tối đa | 10 lần/phút/user |
| Phí giao dịch | 0 (nội bộ HKi) |

## Đảm bảo ACID

- **Atomic**: Cả debit và credit xảy ra trong 1 transaction
- **Consistent**: Balance không bao giờ âm
- **Isolated**: Transaction dùng MongoDB session
- **Durable**: Đã commit → không mất dù restart server

## Hậu điều kiện
- Balance người gửi giảm đúng amount
- Balance người nhận tăng đúng amount
- 1 Transaction record với status COMPLETED được tạo
- Cả 2 bên nhận thông báo
