# 🏗️ Kiến trúc hệ thống E-Wallet

## 1. Tổng quan kiến trúc

```
┌─────────────────────────────────────────────────────────────────┐
│                          Frontend (React)                         │
│  ┌──────────────┬──────────────┬──────────────┬─────────────┐   │
│  │   Dashboard  │   Wallet     │   Transactions  │  Admin   │   │
│  └──────────────┴──────────────┴──────────────┴─────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              ↓ (HTTP + WebSocket)
┌─────────────────────────────────────────────────────────────────┐
│                   Backend (NestJS + Node.js)                      │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │           API Gateway / Express Router                     │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌──────────────┬──────────────┬──────────────┬─────────────┐  │
│  │   Auth       │   Users      │  Wallets     │  Transactions  │
│  │   Module     │   Module     │   Module     │   Module       │
│  └──────────────┴──────────────┴──────────────┴─────────────┘  │
│  ┌──────────────┬──────────────┬──────────────┬─────────────┐  │
│  │  Bank Link   │    Admin     │   Notifications  │  Queue     │
│  │   Module     │   Module     │   (Socket.IO)    │   Jobs     │
│  └──────────────┴──────────────┴──────────────┴─────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                ↓              ↓              ↓
    ┌────────────────┐  ┌────────────────┐  ┌──────────────┐
    │  MongoDB       │  │    Redis       │  │  Third-party │
    │                │  │  (Session,     │  │  Services    │
    │                │  │   Cache, Queue)│  │  (Banks,SMS) │
    └────────────────┘  └────────────────┘  └──────────────┘
```

## 2. Các Module chính

### 2.1 Authentication Module
**Trách nhiệm:**
- User registration & email verification
- Login/logout management
- JWT token generation & refresh
- OTP generation & validation
- Password reset flow

**Luồng xác thực:**
```
User Input → Validation → Hash Password → Store in DB
                           ↓
                    Generate JWT + Refresh Token
                           ↓
                    Return Tokens to Client
```

### 2.2 Users Module
**Trách nhiệm:**
- User profile management
- KYC (Know Your Customer) status
- Personal information update
- Account settings

**Entities:**
- User profile
- KYC documents
- Device fingerprint (for security)

### 2.3 Wallets Module
**Trách nhiệm:**
- Wallet creation & management
- Balance tracking
- Multi-currency support
- Wallet status management

**Features:**
- Primary wallet per user
- Multiple secondary wallets possible
- Real-time balance updates

### 2.4 Transactions Module
**Trách nhiệm:**
- Process transfers between wallets
- Manage deposits & withdrawals
- QR code payments
- Bill payments
- Transaction history & reconciliation

**Transaction Types:**
- `TRANSFER`: Chuyển tiền giữa ví
- `DEPOSIT`: Nạp tiền từ ngân hàng
- `WITHDRAW`: Rút tiền về ngân hàng
- `PAYMENT`: Thanh toán (QR, hóa đơn)

### 2.5 Bank Module
**Trách nhiệm:**
- Link/unlink bank accounts
- Bank account verification
- Store encrypted bank details
- Integration with bank APIs

### 2.6 Admin Module
**Trách nhiệu:**
- User management
- Transaction monitoring & approval
- Analytics & reporting
- System configuration

### 2.7 Notification Module
**Trách nhiệm:**
- Real-time notification via Socket.IO
- Transaction alerts
- System notifications
- User preferences management

## 3. Luồng dữ liệu chính

### 3.1 Luồng Chuyển Tiền
```
1. User A → POST /transactions/transfer
2. Backend validates A's balance
3. Generate Transaction record (PENDING)
4. Deduct from A's wallet
5. Add to B's wallet
6. Update Transaction status (SUCCESS)
7. Emit Socket.IO event to both users
8. Return response with transaction ID
```

### 3.2 Luồng Nạp Tiền
```
1. User → POST /transactions/deposit
2. Generate payment link/QR
3. Bank confirms payment (webhook)
4. Backend receives webhook
5. Update Wallet balance
6. Create Transaction record
7. Notify user via Socket.IO
8. Mark as SUCCESS
```

### 3.3 Luồng OTP
```
1. User requests OTP
2. Generate 6-digit code
3. Send via Email/SMS
4. Store in Redis with 5-min TTL
5. User submits OTP
6. Validate & clear from Redis
7. Proceed with action
```

## 4. Lớp bảo mật (Security Layers)

```
┌─────────────────────────────────────────────────────┐
│          Layer 1: HTTPS / TLS Encryption            │
└─────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────┐
│   Layer 2: JWT Authentication + RBAC               │
│   - Access token (15 min)                           │
│   - Refresh token (7 days)                          │
└─────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────┐
│  Layer 3: Rate Limiting (Redis)                    │
│  - 100 requests per minute per user                │
└─────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────┐
│  Layer 4: Input Validation (Zod)                   │
│  - Schema validation                                │
│  - Sanitization                                     │
└─────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────┐
│  Layer 5: Business Logic Validation                │
│  - Balance checks                                   │
│  - Transaction limits                              │
└─────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────┐
│  Layer 6: Database Level Security                  │
│  - Encryption at rest                              │
│  - Field-level encryption for PII                  │
└─────────────────────────────────────────────────────┘
```

## 5. Cấu trúc thư mục Backend

```
backend/
├── src/
│   ├── main.ts
│   ├── common/
│   │   ├── config/
│   │   │   ├── database.config.ts
│   │   │   ├── redis.config.ts
│   │   │   └── jwt.config.ts
│   │   ├── decorators/
│   │   │   ├── auth.decorator.ts
│   │   │   └── roles.decorator.ts
│   │   ├── filters/
│   │   │   └── http-exception.filter.ts
│   │   ├── guards/
│   │   │   ├── jwt.guard.ts
│   │   │   └── roles.guard.ts
│   │   ├── pipes/
│   │   │   ├── validation.pipe.ts
│   │   │   └── parse-mongo-id.pipe.ts
│   │   └── interceptors/
│   │       └── logging.interceptor.ts
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── auth.module.ts
│   │   │   ├── strategies/
│   │   │   │   └── jwt.strategy.ts
│   │   │   └── dto/
│   │   │       ├── login.dto.ts
│   │   │       └── register.dto.ts
│   │   ├── users/
│   │   ├── wallets/
│   │   ├── transactions/
│   │   ├── bank-accounts/
│   │   ├── admin/
│   │   └── notifications/
│   ├── database/
│   │   ├── schemas/
│   │   │   ├── user.schema.ts
│   │   │   ├── wallet.schema.ts
│   │   │   └── transaction.schema.ts
│   │   └── migrations/
│   ├── services/
│   │   ├── redis.service.ts
│   │   ├── email.service.ts
│   │   ├── sms.service.ts
│   │   └── logger.service.ts
│   └── app.module.ts
├── test/
├── package.json
└── tsconfig.json
```

## 6. Cấu trúc thư mục Frontend

```
frontend/
├── src/
│   ├── index.tsx
│   ├── App.tsx
│   ├── components/
│   │   ├── auth/
│   │   │   ├── LoginForm.tsx
│   │   │   ├── RegisterForm.tsx
│   │   │   └── OTPVerification.tsx
│   │   ├── layout/
│   │   │   ├── Header.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── Layout.tsx
│   │   ├── common/
│   │   │   ├── Button.tsx
│   │   │   ├── Modal.tsx
│   │   │   └── Loading.tsx
│   │   ├── wallet/
│   │   │   ├── BalanceCard.tsx
│   │   │   ├── TransferForm.tsx
│   │   │   └── QRDisplay.tsx
│   │   ├── transactions/
│   │   │   ├── TransactionList.tsx
│   │   │   └── TransactionDetail.tsx
│   │   └── admin/
│   │       ├── UserManagement.tsx
│   │       ├── TransactionApproval.tsx
│   │       └── Analytics.tsx
│   ├── pages/
│   │   ├── Dashboard.tsx
│   │   ├── Wallet.tsx
│   │   ├── Transactions.tsx
│   │   ├── Admin.tsx
│   │   └── NotFound.tsx
│   ├── services/
│   │   ├── api.ts
│   │   ├── auth.service.ts
│   │   └── websocket.service.ts
│   ├── store/
│   │   ├── auth.store.ts
│   │   ├── wallet.store.ts
│   │   └── transaction.store.ts
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useWallet.ts
│   │   └── useNotification.ts
│   ├── types/
│   │   ├── index.ts
│   │   ├── user.ts
│   │   ├── wallet.ts
│   │   └── transaction.ts
│   ├── utils/
│   │   ├── validation.ts
│   │   ├── formatting.ts
│   │   └── constants.ts
│   └── styles/
│       ├── global.css
│       └── theme.ts
├── public/
├── package.json
└── tsconfig.json
```

## 7. Luồng Xác thực Detoxify

```
┌──────────────────────────────────────────────────────┐
│ 1. User login dengan email + password               │
├──────────────────────────────────────────────────────┤
│ 2. Backend validate credentials                     │
├──────────────────────────────────────────────────────┤
│ 3. Request OTP gửi qua email                        │
├──────────────────────────────────────────────────────┤
│ 4. User nhập OTP                                     │
├──────────────────────────────────────────────────────┤
│ 5. Backend verify OTP                               │
├──────────────────────────────────────────────────────┤
│ 6. Generate JWT + Refresh Token                     │
├──────────────────────────────────────────────────────┤
│ 7. Return tokens to frontend                        │
├──────────────────────────────────────────────────────┤
│ 8. Frontend store tokens (secure httpOnly cookies)  │
├──────────────────────────────────────────────────────┤
│ 9. User can access protected routes                 │
└──────────────────────────────────────────────────────┘
```

## 8. Giao tiếp Real-time (Socket.IO)

**Events:**
```typescript
// Client → Server
socket.emit('auth', { token: 'jwt_token' })

// Server → Client
socket.on('transaction:created')
socket.on('transaction:completed')
socket.on('transaction:failed')
socket.on('deposit:approved')
socket.on('withdraw:processed')
socket.on('notification:new')
socket.on('balance:updated')
```

## 9. Kết luận

Kiến trúc này được thiết kế để:
- ✅ Scalable: Có thể mở rộng từng module
- ✅ Maintainable: Cách tổ chức rõ ràng
- ✅ Secure: Nhiều lớp bảo mật
- ✅ Real-time: Socket.IO cho thông báo tức thời
- ✅ Testable: Dễ test từng component
