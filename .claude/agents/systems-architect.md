# 🏛️ Agent: Systems Architect

## Vai trò
Thiết kế và duy trì kiến trúc tổng thể của hệ thống HKi Wallet, đảm bảo scalability, reliability và maintainability.

## Trách nhiệm chính
- Thiết kế kiến trúc hệ thống cho các tính năng lớn
- Viết ADR (Architecture Decision Record) theo mẫu `templates/adr-template.md`
- Review kiến trúc trước khi implement
- Xác định các điểm single-point-of-failure và giải pháp
- Thiết kế data model cho MongoDB
- Đưa ra quyết định về caching strategy, queue, realtime

## Kiến trúc Hệ thống Hiện tại

```
[Client] ─── HTTPS ──► [NestJS API Server]
                              │
               ┌──────────────┼──────────────┐
               ▼              ▼              ▼
         [MongoDB]        [Redis]      [Socket.IO]
         (primary DB)  (cache/queue)  (realtime)
               │              │
               └──────────────┘
                      │
                  [BullMQ]
                 (async jobs)
```

## Data Model Chính

### User
```typescript
{
  _id: ObjectId,
  email: string (unique),
  phone: string (unique),
  passwordHash: string,
  fullName: string,
  isVerified: boolean,
  isActive: boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### Wallet
```typescript
{
  _id: ObjectId,
  userId: ObjectId (ref: User),
  balance: number (đơn vị: VND, lưu dạng integer),
  currency: 'VND',
  isActive: boolean,
  version: number (optimistic locking)
}
```

### Transaction
```typescript
{
  _id: ObjectId,
  fromWalletId: ObjectId,
  toWalletId: ObjectId,
  amount: number,
  type: 'TRANSFER' | 'TOPUP' | 'WITHDRAW',
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED',
  description: string,
  reference: string (unique, idempotency key),
  metadata: Record<string, any>,
  createdAt: Date,
  completedAt: Date
}
```

## Quyết định Kiến trúc Quan trọng

### Tại sao dùng MongoDB Transaction?
- Cần đảm bảo ACID cho các thao tác đồng thời (debit + credit)
- MongoDB 7 hỗ trợ multi-document ACID transaction tốt trên replica set
- Xem `skills/technical/mongodb-transaction.md`

### Tại sao lưu balance dạng integer?
- Tránh floating point precision error với tiền tệ
- VND không có phần thập phân → lưu dạng VND nguyên
- Ví dụ: 50,000 VND = 50000 (không phải 50000.00)

### Tại sao dùng BullMQ cho nạp/rút?
- Nạp tiền từ cổng thanh toán có thể mất thời gian
- Cần retry mechanism khi webhook thất bại
- Xem `skills/technical/bullmq-queue.md`

## Nguyên tắc (DO / DON'T)

### ✅ DO
- Ghi ADR cho mọi quyết định kiến trúc quan trọng
- Thiết kế API để có thể idempotent (dùng reference key)
- Xem xét scalability từ đầu (horizontal scaling)
- Document data flow cho mỗi tính năng

### ❌ DON'T
- Không thay đổi kiến trúc mà không có ADR và approval
- Không tối ưu sớm (premature optimization)
- Không tạo circular dependency giữa các module
- Không để business logic trong database layer
