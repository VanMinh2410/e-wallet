# MVP - Danh sách chức năng cần chốt

## Tiêu chí chọn tính năng cho MVP
- Đảm bảo luồng nạp/chuyển/rút tiền hoạt động end-to-end
- Bảo mật cơ bản (đăng nhập, JWT, OTP cho giao dịch quan trọng)
- Giao diện người dùng tối thiểu để thực hiện giao dịch và xem lịch sử
- Admin có thể xem & xử lý giao dịch

## Chức năng MVP (bắt buộc)
1. Đăng ký, đăng nhập, logout (email + mật khẩu)
2. Xác thực bằng OTP/email (khi đăng ký hoặc giao dịch quan trọng)
3. Xem/hiển thị số dư ví
4. Chuyển tiền giữa các tài khoản trong hệ thống
5. Nạp tiền: tạo yêu cầu nạp + xử lý webhook ngân hàng
6. Rút tiền: tạo yêu cầu rút (manual auto-approve ban đầu)
7. Xem lịch sử giao dịch (pagination, filter cơ bản)
8. Thông báo thời gian thực (Socket.IO) cho giao dịch
9. Thao tác quản trị cơ bản: list users, list transactions, approve/reject yêu cầu rút
10. Cấu hình cơ bản: Redis, MongoDB, Docker, Swagger

## Tính năng có thể hoãn (không vào MVP)
- Thanh toán hóa đơn, nạp điện thoại
- Referral / khuyến mãi, điểm thưởng
- Tích hợp cổng thẻ trực tiếp (PCI)
- Multi-currency nâng cao

## Success criteria cho MVP
- Người dùng có thể nạp, chuyển, rút và thấy cập nhật số dư trong 90% trường hợp
- API có test coverage > 60% cho các endpoint chính
- Admin có thể xử lý giao dịch rút tiền

## Ghi chú
MVP hướng tới thị trường VN: ưu tiên tích hợp ngân hàng VN hoặc mô phỏng nếu API thực tế chưa có.