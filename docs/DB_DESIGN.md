# Thiết kế Database (MongoDB) - Giai đoạn này (MVP)

Tập trung vào collections cần cho MVP: `users`, `wallets`, `transactions`, `bank_accounts`, `refresh_tokens`, `otp_records`, `audit_logs`, `notifications`.

## 1. `users`
- _id: ObjectId
- email: string (unique)
- phone: string (optional)
- password_hash: string
- first_name, last_name
- email_verified: boolean
- roles: ["USER", "ADMIN"]
- is_active: boolean
- created_at, updated_at

Indexes:
- { email: 1 } unique
- { created_at: -1 }

## 2. `wallets`
- _id: ObjectId
- user_id: ObjectId (ref users)
- wallet_name: string
- balance: Decimal128
- currency: string ("VND")
- status: enum (ACTIVE, FROZEN)
- is_default: boolean
- created_at, updated_at

Indexes:
- { user_id: 1 }
- { account_number: 1 } unique (optional)

## 3. `transactions`
- _id: ObjectId
- transaction_id: string (business id)
- from_user_id, from_wallet_id
- to_user_id, to_wallet_id
- amount: Decimal128
- currency: string
- type: TRANSFER|DEPOSIT|WITHDRAW|PAYMENT
- status: PENDING|SUCCESS|FAILED
- fee: Decimal128
- reference_code: string (for deposits)
- error_message: string
- metadata: object
- created_at, updated_at, completed_at

Indexes:
- { transaction_id: 1 } unique
- { from_user_id: 1, created_at: -1 }
- { to_user_id: 1, created_at: -1 }

## 4. `bank_accounts`
- _id, user_id
- bank_code, bank_name
- account_number (encrypted)
- account_holder
- is_verified: boolean
- created_at

Indexes:
- { user_id: 1 }

## 5. `refresh_tokens`
- _id, user_id
- token_hash: string
- device_id, user_agent
- expires_at

TTL index on `expires_at` for cleanup

## 6. `otp_records`
- _id, user_id
- code, type, is_used
- expires_at

TTL index on `expires_at`

## 7. `audit_logs`
- user_id, action, resource, resource_id
- details, ip_address, user_agent, status
- created_at

## 8. `notifications`
- user_id, title, message, type
- related_resource, is_read, created_at

## Transactional behavior
- Sử dụng MongoDB session/transaction cho luồng transfer để đảm bảo atomic: trừ ví người gửi + cộng ví người nhận + create transaction

## Lưu ý bảo mật dữ liệu
- Mã hoá `account_number` và các PII trước khi lưu
- Store `refresh_tokens` hashed

## Ví dụ schema (Mongoose) - Transaction (snippet)
```js
const TransactionSchema = new Schema({
  transaction_id: { type: String, unique: true },
  from_user_id: { type: ObjectId, ref: 'User' },
  from_wallet_id: { type: ObjectId, ref: 'Wallet' },
  to_user_id: { type: ObjectId, ref: 'User' },
  to_wallet_id: { type: ObjectId, ref: 'Wallet' },
  amount: { type: Schema.Types.Decimal128 },
  type: { type: String },
  status: { type: String },
  metadata: { type: Object },
  created_at: { type: Date, default: Date.now }
});
```

Kết luận: Thiết kế này đủ cho MVP, có thể mở rộng thêm trường & index theo nhu cầu analytics sau.