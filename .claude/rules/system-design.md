# 🏗️ Quy tắc: System Design

## Nguyên tắc Thiết kế

### 1. Separation of Concerns
- Controller: xử lý HTTP request/response
- Service: business logic
- Repository/Model: data access
- Gateway: Socket.IO events
- Queue Processor: async jobs

### 2. Idempotency
Mọi API tạo giao dịch phải hỗ trợ idempotency:
- Client gửi `X-Idempotency-Key` (UUID)
- Server kiểm tra key trong Redis (TTL 24h)
- Nếu đã xử lý → trả về kết quả cũ
- Nếu chưa → xử lý → lưu kết quả

### 3. Eventual Consistency
- Transaction tài chính: Strong consistency (MongoDB ACID)
- Notification: Eventual consistency (BullMQ queue)
- Cache: Stale-while-revalidate

### 4. Fail Fast
- Validate sớm nhất có thể (DTO validation → business validation → DB)
- Throw exception ngay khi phát hiện sai, không tiếp tục

## Data Flow – Chuyển khoản

```
[Client] → POST /transfers
    → JwtAuthGuard (verify token)
    → ThrottleGuard (rate limit)
    → ValidationPipe (DTO validation)
    → WalletController.transfer()
    → WalletService.transfer()
        → Kiểm tra số dư (business validation)
        → Mở MongoDB Session
        → startTransaction()
        → Debit fromWallet
        → Credit toWallet
        → Tạo Transaction record
        → commitTransaction()
        → Emit socket event
        → Đẩy BullMQ notification job
    → Return response
```

## Caching Strategy

### Cache dùng cho:
- User profile (TTL: 5 phút)
- Wallet balance (KHÔNG cache – realtime)
- Transaction history page 1 (TTL: 30 giây)
- Rate limit counters (Redis native)

### Không cache:
- Balance (phải realtime)
- Transaction list đang PENDING
- Auth tokens (không dùng cache, dùng JWT verify)

## Scalability Considerations

- Stateless backend → dễ horizontal scale
- Redis pub/sub cho Socket.IO khi multi-instance
- MongoDB read replica cho read-heavy queries
- BullMQ cho decoupling async work
