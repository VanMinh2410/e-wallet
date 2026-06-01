# Yêu cầu nghiệp vụ - E-Wallet

## Mục tiêu chính
- Xây dựng ứng dụng ví điện tử cho phép người dùng nạp, rút, chuyển và thanh toán nhanh chóng, an toàn.
- Hỗ trợ thông báo thời gian thực, quản lý lịch sử giao dịch và liên kết ngân hàng.
- Cung cấp giao diện quản trị để theo dõi và xử lý giao dịch.

## Các bên liên quan
- Người dùng cuối (User)
- Quản trị viên hệ thống (Admin)
- Ngân hàng / cổng thanh toán (Third-party)
- Hệ thống gửi SMS/Email (Notification provider)

## Yêu cầu chức năng (tóm tắt)
- Đăng ký / Đăng nhập / Đăng xuất, xác thực bằng OTP/email
- Quản lý hồ sơ người dùng, KYC cơ bản
- Tạo & quản lý ví, hiển thị số dư
- Liên kết tài khoản ngân hàng / thẻ
- Nạp tiền (deposit) từ ngân hàng bằng reference + webhook
- Rút tiền (withdraw) về ngân hàng với quy trình phê duyệt
- Chuyển tiền giữa người dùng (transfer)
- Thanh toán QR & thanh toán hóa đơn (mở rộng)
- Lịch sử giao dịch, lọc, và xuất báo cáo
- Thông báo thời gian thực qua Socket.IO
- Quản trị: quản lý người dùng, giao dịch, thống kê

## Yêu cầu phi chức năng
- Bảo mật: JWT, refresh token, mã hoá dữ liệu nhạy cảm
- Hiệu năng: p95 API < 200ms cho read ops
- Khả năng mở rộng: phân tách service dễ dàng
- Khả năng phục hồi: backup MongoDB hàng ngày
- Giám sát: logging, metrics, alert

## Ràng buộc & Giả định
- Giao tiếp với ngân hàng qua API/webhook (nếu không có, dùng mô phỏng)
- Thanh toán thẻ/QR tuân thủ quy định địa phương (PCI nếu xử lý thẻ)
- Dữ liệu nhạy cảm phải được mã hoá ở tầng ứng dụng

## Kết luận
Tài liệu này là bản tóm tắt nghiệp vụ để định hướng thiết kế hệ thống và làm cơ sở cho MVP.