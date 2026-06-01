# 📚 Lịch sử Quyết định (Architecture Decision Records)

## Danh sách ADR

| ID | Ngày | Tiêu đề | Trạng thái |
|---|---|---|---|
| ADR-001 | 2025-01-01 | Dùng MongoDB Replica Set cho Transaction | Accepted |
| ADR-002 | 2025-01-01 | Dùng BullMQ cho async jobs (nạp/rút) | Accepted |
| ADR-003 | 2025-01-02 | Lưu Refresh Token trong Redis + HttpOnly Cookie | Accepted |
| ADR-004 | 2025-01-02 | Lưu balance dạng integer (VND nguyên) | Accepted |
| ADR-005 | 2025-01-05 | Dùng NestJS monorepo thay vì microservices | Accepted |

---

## ADR-001: Dùng MongoDB Replica Set cho Transaction

**Ngày**: 2025-01-01 | **Trạng thái**: Accepted

**Vấn đề**: Cần ACID transaction cho chuyển khoản (debit + credit phải atomic).

**Quyết định**: Chạy MongoDB với Replica Set (`--replSet rs0`), dùng `startSession()` + `startTransaction()` cho mọi thao tác ghi đồng thời.

**Hệ quả tích cực**: Đảm bảo ACID, tổng tiền luôn bảo toàn dù có lỗi hoặc concurrent request.
**Hệ quả tiêu cực**: Dev environment phức tạp hơn (cần init replica set).

---

## ADR-002: Dùng BullMQ cho Async Jobs

**Ngày**: 2025-01-01 | **Trạng thái**: Accepted

**Vấn đề**: Nạp tiền cần xử lý bất đồng bộ (chờ payment gateway callback). Không thể block HTTP response.

**Quyết định**: Khi có webhook từ payment gateway → đẩy job vào BullMQ queue → worker xử lý async với retry.

**Hệ quả tích cực**: Reliable job processing, retry tự động, monitoring qua Bull Board.

---

## ADR-003: Refresh Token trong Redis + HttpOnly Cookie

**Ngày**: 2025-01-02 | **Trạng thái**: Accepted

**Vấn đề**: Cần có thể revoke refresh token (logout, đổi password, phát hiện đánh cắp).

**Quyết định**: 
- Access Token: memory (biến JS), TTL 15 phút
- Refresh Token: HttpOnly Cookie (client-side) + Redis hash (server-side), TTL 7 ngày
- Khi logout: xóa Redis key → RT không dùng được nữa dù cookie vẫn còn

**Hệ quả tích cực**: Có thể revoke bất kỳ lúc nào. Chống XSS (không localStorage).

---

## ADR-004: Balance lưu dạng Integer (VND)

**Ngày**: 2025-01-02 | **Trạng thái**: Accepted

**Vấn đề**: Floating point không chính xác cho tiền tệ.

**Quyết định**: Lưu balance là `Number` trong MongoDB, đơn vị VND nguyên. VND không có phần thập phân nên không cần đổi sang cent.

---

## ADR-005: NestJS Monorepo thay vì Microservices

**Ngày**: 2025-01-05 | **Trạng thái**: Accepted

**Vấn đề**: Bắt đầu với microservices sẽ quá phức tạp cho team nhỏ.

**Quyết định**: Monorepo với NestJS (1 backend app), BullMQ cho async. Nếu cần scale → tách module sau.

**Hệ quả tích cực**: Đơn giản hơn, develop nhanh hơn, deploy đơn giản hơn.
**Hệ quả tiêu cực**: Scale theo chiều ngang sẽ khó hơn sau này (stateful socket.io cần Redis adapter).

---

*Cập nhật lần cuối: 2025-01-10*
