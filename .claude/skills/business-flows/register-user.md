# 📋 Business Flow: Đăng ký Người dùng

## Use Case: UC-01 – Đăng ký Tài khoản

**Tác nhân**: Người dùng mới (chưa có tài khoản)
**Mục tiêu**: Tạo tài khoản và ví điện tử HKi

## Điều kiện Tiên quyết
- Người dùng có email hợp lệ
- Người dùng có số điện thoại Việt Nam
- Email và số điện thoại chưa đăng ký trong hệ thống

## Luồng Chính (Happy Path)

1. Người dùng điền form: họ tên, email, số điện thoại, mật khẩu
2. Hệ thống validate dữ liệu đầu vào
3. Hệ thống kiểm tra email + phone chưa tồn tại
4. Hệ thống tạo User và Wallet trong MongoDB Transaction
5. Hệ thống gửi email xác minh (OTP 6 chữ số, TTL 10 phút)
6. Người dùng nhập OTP
7. Hệ thống đánh dấu user `isVerified: true`
8. Hệ thống tự động đăng nhập và redirect về Dashboard

## Luồng Ngoại lệ

### E1: Email đã tồn tại
- Thông báo: "Email này đã được đăng ký. Vui lòng đăng nhập hoặc dùng email khác."

### E2: Số điện thoại đã tồn tại
- Thông báo: "Số điện thoại này đã được đăng ký."

### E3: OTP sai
- Cho phép nhập lại tối đa 5 lần
- Sau 5 lần sai: khóa 5 phút

### E4: OTP hết hạn
- Cho phép gửi lại sau 60 giây

## Hậu điều kiện
- User document được tạo với `isVerified: true`
- Wallet document được tạo với `balance: 0`
- User được đăng nhập (có access token + refresh token)

## Business Rules
- Mật khẩu tối thiểu 8 ký tự, có chữ hoa và số
- Số điện thoại định dạng Việt Nam: `0[3-9]xxxxxxxx`
- Email phải xác minh trước khi thực hiện giao dịch
- Mỗi email chỉ có 1 tài khoản
