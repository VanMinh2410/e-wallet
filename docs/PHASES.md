# 📋 PHASES - Phân chia giai đoạn phát triển

## Phase 1: Foundation (2-3 tuần)

### 1.1 Project Setup

**Tasks:**

- [ ] Initialize NestJS backend project
- [ ] Initialize React + TypeScript frontend project
- [ ] Setup MongoDB connection
- [ ] Setup Redis connection
- [ ] Configure environment variables (.env, .env.example)
- [ ] Setup Docker & Docker Compose
- [ ] Initialize Git repository (if not done)

**Deliverables:**

- [ ] Running backend on `http://localhost:3000`
- [ ] Running frontend on `http://localhost:3001`
- [ ] Docker containers for all services
- [ ] Environment configuration

### 1.2 Backend Foundation

**Tasks:**

- [ ] Setup NestJS app structure
- [ ] Configure database (MongoDB with Mongoose)
- [ ] Configure Redis client
- [ ] Setup JWT configuration
- [ ] Create base exception filter
- [ ] Create validation pipe (Zod)
- [ ] Configure Swagger/OpenAPI
- [ ] Setup Winston logging

**Files to create:**

```
src/
├── common/
│   ├── config/
│   │   ├── app.config.ts
│   │   ├── database.config.ts
│   │   ├── redis.config.ts
│   │   └── jwt.config.ts
│   ├── decorators/
│   │   └── auth.decorator.ts
│   ├── filters/
│   │   └── http-exception.filter.ts
│   ├── pipes/
│   │   └── validation.pipe.ts
│   └── interceptors/
│       └── logging.interceptor.ts
├── services/
│   ├── redis.service.ts
│   ├── logger.service.ts
│   └── jwt.service.ts
└── app.module.ts
```

### 1.3 Frontend Foundation

**Tasks:**

- [ ] Setup React project structure
- [ ] Configure TypeScript
- [ ] Setup Tailwind CSS / Material UI
- [ ] Configure Zustand for state management
- [ ] Setup React Router
- [ ] Configure Axios for API calls
- [ ] Create base layout components
- [ ] Setup environment configuration

**Files to create:**

```
src/
├── components/
│   └── layout/
│       ├── Header.tsx
│       ├── Sidebar.tsx
│       └── Layout.tsx
├── pages/
│   └── NotFound.tsx
├── services/
│   └── api.ts
├── store/
│   └── useAppStore.ts
├── types/
│   └── index.ts
├── utils/
│   └── constants.ts
└── App.tsx
```

### 1.4 Database Schema Design

**Tasks:**

- [ ] Design User collection
- [ ] Design Wallet collection
- [ ] Design Transaction collection
- [ ] Design BankAccount collection
- [ ] Create MongoDB indexes
- [ ] Create seed data (optional)

**Deliverables:**

- [ ] Database schema documentation
- [ ] Indexes for performance

### 1.5 Testing Setup

**Tasks:**

- [ ] Configure Jest for backend
- [ ] Configure Vitest for frontend
- [ ] Create sample unit tests
- [ ] Setup test coverage reporting

---

## Phase 2: Authentication & User Management (3-4 tuần)

### 2.1 Authentication Module

**Backend:**

- [ ] User registration endpoint
- [ ] Email verification flow
- [ ] Login endpoint
- [ ] Generate JWT + Refresh token
- [ ] Refresh token endpoint
- [ ] Logout endpoint
- [ ] JWT validation guard
- [ ] Role-based access control (RBAC)

**Database:**

```typescript
User {
  _id: ObjectId
  email: string
  phone: string
  password_hash: string
  first_name: string
  last_name: string
  date_of_birth: Date
  gender: enum
  kyc_status: enum (PENDING, VERIFIED, REJECTED)
  kyc_documents: array
  roles: array (USER, ADMIN)
  is_active: boolean
  email_verified: boolean
  phone_verified: boolean
  profile_picture: string (URL)
  last_login: Date
  failed_login_attempts: number
  locked_until: Date
  created_at: Date
  updated_at: Date
}

RefreshToken {
  _id: ObjectId
  user_id: ObjectId
  token_hash: string
  expires_at: Date
  created_at: Date
}

OTP {
  _id: ObjectId
  user_id: ObjectId
  code: string
  type: enum (EMAIL, SMS, LOGIN)
  is_used: boolean
  expires_at: Date
  created_at: Date
}
```

**API Endpoints:**

```
POST   /api/auth/register              # Register new user
POST   /api/auth/verify-email          # Verify email with OTP
POST   /api/auth/login                 # Login
POST   /api/auth/refresh-token         # Refresh JWT
POST   /api/auth/logout                # Logout
POST   /api/auth/forgot-password       # Request password reset
POST   /api/auth/reset-password        # Reset password
GET    /api/auth/profile               # Get current user profile
```

**Frontend:**

- [ ] Login page with email + password
- [ ] Register page
- [ ] OTP verification component
- [ ] Email verification flow
- [ ] Password reset flow
- [ ] Forgot password page
- [ ] Auth guards for routes
- [ ] Store JWT/Refresh token securely (httpOnly cookies)

### 2.2 User Profile Management

**Backend:**

- [ ] Get user profile endpoint
- [ ] Update user profile endpoint
- [ ] Change password endpoint
- [ ] Add KYC documents endpoint
- [ ] Get KYC status endpoint

**API Endpoints:**

```
GET    /api/users/profile               # Get user profile
PUT    /api/users/profile               # Update profile
POST   /api/users/kyc                   # Upload KYC documents
GET    /api/users/kyc-status            # Check KYC status
PUT    /api/users/password              # Change password
```

**Frontend:**

- [ ] User profile page
- [ ] Edit profile form
- [ ] Change password form
- [ ] KYC document upload
- [ ] Profile picture upload

### 2.3 Role-Based Access Control

**Implementation:**

- [ ] Create roles enum (USER, ADMIN, SUPER_ADMIN)
- [ ] Create roles decorator
- [ ] Create roles guard
- [ ] Implement permission checking

**Roles:**

```typescript
USER: 
  - Can view own profile
  - Can manage own wallets
  - Can create transactions
  - Can view transaction history

ADMIN:
  - Can manage users
  - Can view all transactions
  - Can approve/reject transactions
  - Can view analytics

SUPER_ADMIN:
  - All admin permissions
  - Can manage admins
  - Can configure system settings
```

### 2.4 Testing

- [ ] Unit tests for auth service
- [ ] Integration tests for auth endpoints
- [ ] Frontend tests for login flow

---

## Phase 3: Wallet & Transaction Core (3-4 tuần)

### 3.1 Wallet Management

**Database:**

```typescript
Wallet {
  _id: ObjectId
  user_id: ObjectId
  wallet_name: string
  balance: Decimal (MongoDB Decimal128)
  currency: enum (VND, USD, etc.)
  wallet_type: enum (PRIMARY, SECONDARY)
  status: enum (ACTIVE, FROZEN, SUSPENDED)
  daily_limit: Decimal
  monthly_limit: Decimal
  is_default: boolean
  account_number: string (for bank integration)
  created_at: Date
  updated_at: Date
}
```

**Backend Endpoints:**

```
GET    /api/wallets                    # List user wallets
POST   /api/wallets                    # Create new wallet
GET    /api/wallets/:id                # Get wallet details
PUT    /api/wallets/:id                # Update wallet
DELETE /api/wallets/:id                # Delete wallet
GET    /api/wallets/:id/balance        # Get balance
```

**Frontend:**

- [ ] Wallet list page
- [ ] Create wallet form
- [ ] Wallet details page
- [ ] Balance display card
- [ ] Real-time balance update

### 3.2 Transaction Processing

**Database:**

```typescript
Transaction {
  _id: ObjectId
  transaction_id: string (unique)
  from_user_id: ObjectId
  from_wallet_id: ObjectId
  to_user_id: ObjectId
  to_wallet_id: ObjectId
  amount: Decimal
  currency: string
  type: enum (TRANSFER, DEPOSIT, WITHDRAW, PAYMENT)
  status: enum (PENDING, SUCCESS, FAILED, CANCELLED)
  description: string
  fee: Decimal (default 0)
  reference_code: string
  error_message: string
  metadata: object
  created_at: Date
  updated_at: Date
  completed_at: Date
}
```

**Backend Endpoints:**

```
POST   /api/transactions/transfer      # Transfer money
POST   /api/transactions/deposit       # Request deposit
POST   /api/transactions/withdraw      # Request withdrawal
GET    /api/transactions/history       # Get transaction history
GET    /api/transactions/:id           # Get transaction details
```

**Business Logic:**

- [ ] Validate sender has sufficient balance
- [ ] Validate recipient exists
- [ ] Check daily/monthly transaction limits
- [ ] Apply transaction fee (if any)
- [ ] Create transaction record
- [ ] Deduct from sender wallet
- [ ] Add to recipient wallet
- [ ] Mark transaction as SUCCESS
- [ ] Emit notification

**Frontend:**

- [ ] Transfer form with validation
- [ ] Transaction history list
- [ ] Filter & search transactions
- [ ] Transaction detail view
- [ ] Status indicators

### 3.3 Transaction History & Reconciliation

**Backend:**

- [ ] Get transaction history with pagination
- [ ] Filter by date range
- [ ] Filter by transaction type
- [ ] Filter by status
- [ ] Export transaction history (CSV)

**Frontend:**

- [ ] Transaction history table
- [ ] Date range picker
- [ ] Filter controls
- [ ] Export functionality
- [ ] Print invoice

### 3.4 Error Handling & Rollback

- [ ] Transaction rollback on failure
- [ ] Error logging for debugging
- [ ] Retry mechanism for failed transactions
- [ ] User-friendly error messages

---

## Phase 4: Bank Integration & Advanced Features (3-4 tuần)

### 4.1 Bank Account Linking

**Database:**

```typescript
BankAccount {
  _id: ObjectId
  user_id: ObjectId
  bank_code: string
  bank_name: string
  account_number: string
  account_holder: string
  account_holder_id: string (encrypted)
  is_verified: boolean
  verified_at: Date
  verification_method: enum (OTP, DOCUMENT)
  is_primary: boolean
  created_at: Date
  updated_at: Date
}
```

**Backend Endpoints:**

```
POST   /api/bank-accounts              # Link bank account
GET    /api/bank-accounts              # List bank accounts
GET    /api/bank-accounts/:id          # Get bank account
PUT    /api/bank-accounts/:id          # Update bank account
DELETE /api/bank-accounts/:id          # Unlink bank account
POST   /api/bank-accounts/:id/verify   # Verify with OTP
```

**Implementation:**

- [ ] Encrypt sensitive bank data
- [ ] Integrate with third-party bank API (if available)
- [ ] OTP verification for linking
- [ ] Account number validation

### 4.2 Bank Deposits

**Flow:**

```
1. User initiates deposit
2. System generates payment reference
3. User transfers to e-wallet's bank account
4. Bank webhook confirms payment
5. System updates wallet balance
6. Notify user via Socket.IO
```

**Implementation:**

- [ ] Create deposit request endpoint
- [ ] Generate unique payment reference
- [ ] Setup webhook for bank confirmations
- [ ] Automatic balance update on confirmation
- [ ] Error handling for payment failures

### 4.3 Bank Withdrawals

**Flow:**

```
1. User requests withdrawal
2. Validate balance & limits
3. Create withdrawal request (PENDING)
4. Process withdrawal (automatic or manual)
5. Deduct from wallet
6. Send to bank
7. Update status
8. Notify user
```

**Implementation:**

- [ ] Create withdrawal endpoint
- [ ] Withdrawal limit checks
- [ ] Admin approval workflow (optional)
- [ ] Integration with bank API
- [ ] Webhook for withdrawal status updates

### 4.4 QR Code Payment

**Database:**

```typescript
QRTransaction {
  _id: ObjectId
  sender_id: ObjectId
  sender_wallet_id: ObjectId
  qr_code: string
  qr_string: string (contains wallet_id or special code)
  amount: Decimal (optional, can be filled by payer)
  description: string
  is_used: boolean
  used_at: Date
  created_at: Date
}
```

**Features:**

- [ ] Generate QR code from wallet ID
- [ ] Display QR code on user profile
- [ ] Scan QR code to initiate transfer
- [ ] Optional fixed amount QR codes

**Frontend:**

- [ ] QR display component
- [ ] QR scanner component (react-qr-reader)
- [ ] Request payment QR code

---

## Phase 5: Real-time Notifications & Admin (2-3 tuần)

### 5.1 Socket.IO Setup

**Implementation:**

- [ ] Setup Socket.IO on backend
- [ ] Configure namespaces & rooms
- [ ] Implement authentication for WebSocket
- [ ] Create notification service

**Namespaces:**

```typescript
/notifications     # General notifications
/transactions      # Transaction updates
/admin             # Admin-only events
```

### 5.2 Real-time Notifications

**Events to implement:**

```typescript
// Transaction events
socket.emit('transaction:created', { transactionId, status })
socket.emit('transaction:completed', { transactionId, amount })
socket.emit('transaction:failed', { transactionId, reason })

// Wallet events
socket.emit('balance:updated', { walletId, newBalance })
socket.emit('wallet:created', { walletId })

// General notifications
socket.emit('notification:new', { title, message, icon })
socket.emit('notification:read', { notificationId })
```

**Database for Notifications:**

```typescript
Notification {
  _id: ObjectId
  user_id: ObjectId
  title: string
  message: string
  type: enum (TRANSACTION, WALLET, SYSTEM)
  icon: string
  link: string
  is_read: boolean
  read_at: Date
  created_at: Date
}
```

**Frontend:**

- [ ] Real-time notification display (toast/bell)
- [ ] Notification center (list view)
- [ ] Mark as read functionality
- [ ] Notification preferences (mute/unmute)

### 5.3 Admin Dashboard

**Features:**

- [ ] User management (search, filter, ban/unban)
- [ ] Transaction monitoring (filter, approve/reject)
- [ ] System statistics (daily/monthly stats)
- [ ] Daily active users
- [ ] Total transaction volume
- [ ] Revenue/fees earned

**Backend Endpoints:**

```
GET    /api/admin/users                # List all users (paginated)
GET    /api/admin/users/:id            # Get user details
POST   /api/admin/users/:id/ban        # Ban user
POST   /api/admin/users/:id/unban      # Unban user

GET    /api/admin/transactions         # List all transactions
POST   /api/admin/transactions/:id/approve
POST   /api/admin/transactions/:id/reject

GET    /api/admin/stats/overview       # Overview stats
GET    /api/admin/stats/users          # User stats
GET    /api/admin/stats/transactions   # Transaction stats
```

**Frontend:**

- [ ] User management page
- [ ] Transaction approval queue
- [ ] Analytics dashboard with charts
- [ ] System logs viewer

### 5.4 Testing

- [ ] Socket.IO connection tests
- [ ] Admin endpoint tests
- [ ] Real-time notification tests

---

## Phase 6: Security & Advanced Features (2-3 tuần)

### 6.1 Advanced Security

**Implementation:**

- [ ] Rate limiting (Redis)
- [ ] Account lockout after failed logins
- [ ] Device fingerprinting
- [ ] Unusual activity detection
- [ ] 2FA (optional: Authenticator app)
- [ ] Account recovery options

**Features:**

- [ ] Detect suspicious login from new device
- [ ] Limit login attempts
- [ ] Force password change on suspicious activity
- [ ] Security audit log

### 6.2 Encryption & Data Protection

- [ ] Encrypt PII fields (SSN, ID number)
- [ ] Encrypt bank account numbers
- [ ] Hash passwords (bcrypt)
- [ ] TLS/HTTPS enforcement
- [ ] SQL injection prevention (already handled by Mongoose)
- [ ] XSS prevention
- [ ] CSRF protection

### 6.3 Rate Limiting

**Strategy:**

```typescript
// Limit auth endpoints
POST /api/auth/login: 5 attempts per minute
POST /api/auth/register: 3 per 5 minutes

// Limit transaction endpoints
POST /api/transactions/*: 10 per minute per user

// Limit general API
Any endpoint: 100 per minute per user
```

### 6.4 Audit Logging

**Database:**

```typescript
AuditLog {
  _id: ObjectId
  user_id: ObjectId
  action: string
  resource: string
  resource_id: ObjectId
  changes: object
  ip_address: string
  user_agent: string
  status: enum (SUCCESS, FAILURE)
  error_message: string
  created_at: Date
}
```

**Events to log:**

- User login/logout
- Profile changes
- Bank account linking
- Transactions
- Admin actions
- Failed access attempts

---

## Phase 7: Testing & Quality Assurance (2-3 tuần)

### 7.1 Unit Tests

**Backend:**

- [ ] Auth service tests
- [ ] Wallet service tests
- [ ] Transaction service tests
- [ ] Bank account service tests

**Frontend:**

- [ ] Component tests
- [ ] Hook tests
- [ ] Store tests

### 7.2 Integration Tests

**Backend:**

- [ ] Auth flow (register → login → access)
- [ ] Transfer flow
- [ ] Deposit flow
- [ ] Withdrawal flow
- [ ] Admin operations

**Frontend:**

- [ ] Login flow
- [ ] Transfer flow
- [ ] User profile update

### 7.3 E2E Tests

- [ ] Critical user flows (Cypress)
- [ ] Admin workflows
- [ ] Edge cases & error scenarios

### 7.4 Performance Testing

- [ ] Load testing (Artillery)
- [ ] Database query optimization
- [ ] API response time targets
- [ ] Frontend performance (Lighthouse)

### 7.5 Security Testing

- [ ] Vulnerability scanning (npm audit, Snyk)
- [ ] Penetration testing (optional)
- [ ] OWASP Top 10 checks

---

## Phase 8: Deployment & DevOps (2-3 tuần)

### 8.1 Docker Setup

- [ ] Backend Dockerfile
- [ ] Frontend Dockerfile
- [ ] Docker Compose configuration
- [ ] Volume configuration for data persistence

### 8.2 CI/CD Pipeline (GitHub Actions)

- [ ] Unit test workflow
- [ ] Build workflow
- [ ] Integration test workflow
- [ ] Deploy workflow (staging & production)

### 8.3 Monitoring & Logging

- [ ] Application logs aggregation
- [ ] Error tracking (Sentry)
- [ ] Performance monitoring
- [ ] Uptime monitoring

### 8.4 Documentation

- [ ] API documentation (Swagger)
- [ ] Setup guide
- [ ] Deployment guide
- [ ] Architecture documentation
- [ ] Troubleshooting guide

---

## Timeline Summary

| Phase                    | Duration | Weeks                            |
| ------------------------ | -------- | -------------------------------- |
| 1. Foundation            | 2-3      | Weeks 1-3                        |
| 2. Auth & Users          | 3-4      | Weeks 4-7                        |
| 3. Wallet & Transactions | 3-4      | Weeks 8-11                       |
| 4. Bank Integration      | 3-4      | Weeks 12-15                      |
| 5. Notifications & Admin | 2-3      | Weeks 16-18                      |
| 6. Security & Advanced   | 2-3      | Weeks 19-21                      |
| 7. Testing & QA          | 2-3      | Weeks 22-24                      |
| 8. Deployment            | 2-3      | Weeks 25-27                      |
| **TOTAL**          |          | **~27 weeks (6-7 months)** |

---

## Milestones

**Milestone 1 (Week 3):** Core infrastructure ready
**Milestone 2 (Week 7):** User authentication complete
**Milestone 3 (Week 11):** Wallet & transactions working
**Milestone 4 (Week 15):** Bank integration done
**Milestone 5 (Week 21):** Feature complete
**Milestone 6 (Week 24):** All tests passing
**Milestone 7 (Week 27):** Production ready
