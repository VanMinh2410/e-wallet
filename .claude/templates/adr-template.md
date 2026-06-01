# ADR-XXX: [Tiêu đề ngắn gọn về quyết định]

**Ngày**: YYYY-MM-DD
**Trạng thái**: Proposed | Accepted | Deprecated | Superseded by ADR-YYY
**Tác giả**: [Tên]

---

## Bối cảnh (Context)

<!-- Mô tả tình huống và vấn đề cần giải quyết.
Điều gì đang xảy ra? Tại sao cần đưa ra quyết định này? -->

## Quyết định (Decision)

<!-- Mô tả quyết định đã chọn.
Chúng ta sẽ làm gì? Dùng công nghệ/pattern/approach nào? -->

## Các Phương án đã Xem xét (Alternatives Considered)

### Phương án 1: [Tên]
- **Ưu điểm**: 
- **Nhược điểm**: 
- **Lý do không chọn**: 

### Phương án 2: [Tên]
- **Ưu điểm**: 
- **Nhược điểm**: 
- **Lý do không chọn**: 

## Hệ quả (Consequences)

### Tích cực
- 

### Tiêu cực / Đánh đổi
- 

### Rủi ro
- 

## Tài liệu tham khảo

- [Link tài liệu liên quan]
- [Link issue/PR]

---
*Ví dụ*:

# ADR-001: Dùng MongoDB Replica Set cho Transaction

**Ngày**: 2025-01-01
**Trạng thái**: Accepted

## Bối cảnh
HKi Wallet cần đảm bảo ACID cho các giao dịch chuyển khoản. Nếu không có transaction, việc debit và credit có thể không đồng bộ khi có lỗi hoặc concurrent requests.

## Quyết định
Dùng MongoDB Replica Set (tối thiểu 1 node) để hỗ trợ multi-document ACID transaction.

## Hệ quả
- **Tích cực**: Đảm bảo ACID, tổng tiền luôn bảo toàn
- **Tiêu cực**: Phức tạp hơn trong cấu hình dev environment
