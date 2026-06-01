# 🤖 CLAUDE.md – Hướng dẫn AI cho Dự án HKi Wallet

## 1. Giới thiệu Dự án

**HKi Wallet** là hệ thống ví điện tử nội bộ, cho phép người dùng:
- Đăng ký / đăng nhập bảo mật (JWT + Refresh Token lưu Redis)
- Nạp tiền, rút tiền, chuyển khoản nội bộ
- Thanh toán bằng QR Code
- Theo dõi lịch sử giao dịch theo thời gian thực (Socket.IO)
- Nhận thông báo push khi có biến động số dư

**Tech Stack:**
| Layer | Công nghệ |
|---|---|
| Frontend | React 18, Redux Toolkit, React Query, Socket.IO Client |
| Backend | NestJS 10, Mongoose, Passport.js |
| Database | MongoDB 7 (replica set – hỗ trợ transaction) |
| Cache | Redis 7 (Bull Queue, session, rate limit) |
| Realtime | Socket.IO 4 |
| Queue | BullMQ |
| DevOps | Docker Compose, GitHub Actions |

---

## 2. Nguyên tắc làm việc với AI

> 📖 **Xem thứ tự đọc file đầy đủ tại: `.claude/READING_ORDER.md`**
> File này định nghĩa chính xác file nào cần đọc trước cho từng loại nhiệm vụ (backend, frontend, test, deploy, fix bug...).

### 2.1 Luôn đọc rules trước khi sinh code
Trước khi sinh bất kỳ đoạn code nào, hãy đọc các file trong thư mục `rules/`:
- `rules/code-style.md` – chuẩn viết code
- `rules/naming-conventions.md` – quy tắc đặt tên
- `rules/api-conventions.md` – chuẩn REST API
- `rules/security.md` – bảo mật bắt buộc
- `rules/error-handling.md` – xử lý lỗi
- `rules/database.md` – ràng buộc database
- `rules/testing.md` – coverage, loại test, cách viết test

### 2.2 Đọc skills khi xử lý nghiệp vụ phức tạp
Khi gặp các tình huống phức tạp, tham khảo:
- `skills/technical/` – kỹ thuật chuyên biệt (transaction, JWT, socket...)
- `skills/backend-flows/` – luồng xử lý backend
- `skills/frontend-flows/` – luồng xử lý frontend
- `skills/business-flows/` – logic nghiệp vụ
- `skills/testing-flows/` – cách viết test

### 2.3 Tham khảo context hiện tại
- `context/current-sprint.md` – sprint đang chạy, task cần làm
- `context/known-bugs.md` – lỗi đang theo dõi
- `context/decisions.md` – các quyết định kiến trúc đã chốt

### 2.4 Chuẩn đầu ra khi AI xử lý task
- Nêu giả định rõ ràng nếu yêu cầu còn thiếu chi tiết.
- Chỉ ra file nào sẽ bị ảnh hưởng trước khi sửa.
- Xác nhận bước validation đã chạy hoặc lý do chưa thể chạy.

---

## 3. Cấu trúc Thư mục Quan trọng

```
.claude/
├── agents/          # Định nghĩa vai trò từng agent AI
├── commands/        # Quy trình thực thi (setup, deploy, test...)
├── rules/           # Quy tắc bắt buộc cho toàn dự án
├── skills/          # Hướng dẫn kỹ thuật và luồng nghiệp vụ
├── workflows/       # Quy trình dài (release, incident...)
├── templates/       # Mẫu PR, issue, commit, ADR, test case
├── scripts/         # Script tiện ích
├── prompts/         # Mẫu câu hỏi AI
├── context/         # Thông tin sprint, bug, quyết định hiện tại
├── hooks/           # Git hooks tích hợp AI
├── validators/      # Kiểm tra tuân thủ quy tắc
└── automation/      # CI/CD và tự động hóa
```

---

## 4. Các Ràng buộc Quan trọng Không được Vi phạm

### 4.1 Transaction
- **Mọi thao tác ghi đồng thời** (chuyển khoản, nạp/rút) PHẢI dùng MongoDB Session + Transaction.
- Không bao giờ cập nhật balance trực tiếp mà không dùng transaction.
- Xem: `skills/technical/mongodb-transaction.md`

### 4.2 Bảo mật JWT
- Access Token: TTL 15 phút, lưu trong memory (không localStorage).
- Refresh Token: TTL 7 ngày, lưu trong `HttpOnly Cookie` + Redis.
- Xem: `skills/technical/jwt-refresh-token.md`

### 4.3 Rate Limiting
- API đăng nhập: tối đa 5 lần/phút/IP.
- API chuyển tiền: tối đa 10 lần/phút/user.
- Xem: `rules/security.md`

### 4.4 Socket.IO
- Emit event sau khi transaction commit thành công.
- Không emit trong try block (trước khi commit).
- Xem: `skills/technical/socket-io-realtime.md`

### 4.5 Error Handling
- Luôn trả về format chuẩn: `{ success, statusCode, message, data, error }`.
- Không để lộ stack trace ra client trong production.
- Xem: `rules/error-handling.md`

---

## 5. Quy trình Phát triển Tính năng Mới

1. Đọc `context/current-sprint.md` để biết task ưu tiên
2. Đọc `rules/` liên quan
3. Tham khảo `skills/` phù hợp
4. Sinh code theo đúng cấu trúc dự án (`rules/project-structure.md`)
5. Viết test theo `skills/testing-flows/`
6. Tạo PR theo mẫu `templates/pr-template.md`

---

## 6. Agent Mặc định

Khi không có chỉ định cụ thể, AI sẽ hoạt động theo vai trò **Project Manager** (`agents/project-manager.md`), điều phối tổng thể và phân công đúng agent cho từng task.

---

*Cập nhật lần cuối: 2025-01-01 | Phiên bản: 1.0.0*
