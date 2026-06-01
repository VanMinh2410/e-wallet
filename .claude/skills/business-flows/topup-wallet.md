# ⬇️ Business Flow: Nạp tiền Ví

## Use Case: UC-03 – Nạp tiền từ cổng thanh toán

**Tác nhân**: Người dùng đã đăng nhập
**Mục tiêu**: Nạp tiền từ ngân hàng / ví ngoài vào ví HKi

## Điều kiện Tiên quyết
- Người dùng đã đăng nhập
- Người dùng chọn phương thức thanh toán được hỗ trợ

## Luồng Chính

1. Người dùng chọn phương thức và nhập số tiền
2. HKi tạo transaction PENDING + gọi Payment Gateway API
3. HKi trả về `paymentUrl`, redirect người dùng đến cổng
4. Người dùng hoàn tất thanh toán trên cổng
5. Cổng redirect người dùng về HKi kèm kết quả
6. Cổng gọi webhook đến HKi (bảo đảm hơn redirect)
7. HKi verify webhook signature
8. HKi đẩy job vào BullMQ queue
9. Worker xử lý: verify payment + tăng balance (trong transaction)
10. Worker emit socket event + gửi notification

## Business Rules

| Rule | Giá trị |
|---|---|
| Số tiền tối thiểu | 10.000 VNĐ |
| Số tiền tối đa/lần | 50.000.000 VNĐ |
| Phí nạp | Tùy cổng (hiển thị trước) |
| Thời gian xử lý | Tức thì (< 30 giây) |

## Idempotency
- Mỗi yêu cầu nạp có `reference` duy nhất
- Webhook có thể gửi nhiều lần → chỉ xử lý 1 lần

## Hậu điều kiện
- Balance tăng đúng số tiền (sau phí nếu có)
- Transaction COMPLETED được tạo
- Người dùng nhận thông báo
