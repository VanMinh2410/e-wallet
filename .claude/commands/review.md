# 👀 Lệnh: Review Code

## Mô tả
Checklist review code chuẩn cho dự án HKi Wallet. Áp dụng khi review PR của người khác hoặc tự review trước khi tạo PR.

## Checklist Tổng quát

### 1. Kiến trúc & Thiết kế
- [ ] Code theo đúng cấu trúc thư mục (`rules/project-structure.md`)
- [ ] Không có circular dependency
- [ ] Không vi phạm nguyên tắc SOLID
- [ ] Module/component có trách nhiệm rõ ràng (Single Responsibility)

### 2. Code Quality
- [ ] Đặt tên rõ ràng, không viết tắt khó hiểu (`rules/naming-conventions.md`)
- [ ] Không có code trùng lặp (DRY)
- [ ] Không có dead code hoặc commented-out code
- [ ] Không dùng `any` type trong TypeScript
- [ ] Không có magic number (dùng const hoặc enum)
- [ ] Hàm ngắn gọn, không quá 30 dòng logic

### 3. Bảo mật (Quan trọng!)
- [ ] Input validation đầy đủ (class-validator hoặc Zod)
- [ ] API liên quan đến tiền có auth guard
- [ ] Rate limiting đã cấu hình
- [ ] Không log thông tin nhạy cảm (password, token, số tài khoản)
- [ ] Không expose internal error ra client
- [ ] SQL/NoSQL injection prevention

### 4. Database & Transaction
- [ ] Thao tác ghi đồng thời dùng MongoDB Transaction
- [ ] Transaction có rollback khi lỗi
- [ ] Index đã tạo cho các field query thường xuyên
- [ ] Không thực hiện N+1 query

### 5. Error Handling
- [ ] Tất cả lỗi được xử lý (không có unhandled promise)
- [ ] Response lỗi theo format chuẩn (`rules/error-handling.md`)
- [ ] Có log đầy đủ khi lỗi xảy ra
- [ ] Transaction rollback khi exception

### 6. Test
- [ ] Có unit test cho logic quan trọng
- [ ] Có test cho happy path và failure path
- [ ] Coverage đạt ngưỡng theo `rules/testing.md` cho module mới
- [ ] Test không phụ thuộc thứ tự

### 7. API Conventions
- [ ] HTTP method đúng (GET/POST/PUT/DELETE/PATCH)
- [ ] HTTP status code đúng
- [ ] Response format nhất quán
- [ ] Endpoint đặt tên theo kebab-case
- [ ] Có pagination cho list endpoint

### 8. Socket.IO (nếu có)
- [ ] Emit event SAU KHI transaction commit thành công
- [ ] Không emit trong try block trước commit
- [ ] Event name theo snake_case

### 9. Performance
- [ ] Không có blocking operation trong main thread
- [ ] Long-running task đã chuyển sang BullMQ queue
- [ ] Cache đã áp dụng cho data ít thay đổi

### 10. Documentation
- [ ] JSDoc cho function/method public
- [ ] README cập nhật nếu có thay đổi lớn
- [ ] Swagger annotation cho API mới

## Câu hỏi Reviewer Cần Hỏi
1. "Điều gì xảy ra nếu request này bị gọi đồng thời 100 lần?"
2. "Điều gì xảy ra nếu MongoDB mất kết nối giữa chừng?"
3. "Điều gì xảy ra nếu Redis không khả dụng?"
4. "Làm sao đảm bảo idempotency?"
