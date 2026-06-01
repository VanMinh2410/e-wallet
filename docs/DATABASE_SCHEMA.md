# 🗄️ Database Schema - MongoDB

## Collections Overview

```
┌─────────────────────────────────────────────────────┐
│                    E-Wallet DB                      │
├─────────────────────────────────────────────────────┤
│ ✓ users                 │ Users data                │
│ ✓ wallets               │ Wallet info               │
│ ✓ transactions          │ All transactions          │
│ ✓ bank_accounts         │ Linked bank accounts      │
│ ✓ notifications         │ User notifications        │
│ ✓ refresh_tokens        │ JWT refresh tokens        │
│ ✓ otp_records           │ OTP verification          │
│ ✓ audit_logs            │ System audit trail        │
│ ✓ settings              │ System configuration      │
└─────────────────────────────────────────────────────┘
```

---

## 1. Users Collection

```typescript
db.users = {
  _id: ObjectId,
  
  // Basic Info
  email: string,                    // Unique, indexed
  phone: string,                    // Unique, optional
  password_hash: string,            // Bcrypt hash
  
  // Personal Info
  first_name: string,
  last_name: string,
  date_of_birth: Date,
  gender: enum("MALE", "FEMALE", "OTHER"),
  
  // Identity
  id_number: string,                // Encrypted
  id_type: enum("PASSPORT", "NATIONAL_ID", "DRIVER_LICENSE"),
  id_verified: boolean,
  id_verified_at: Date,
  
  // Profile
  profile_picture: string,          // URL
  bio: string,
  
  // KYC Status
  kyc_status: enum("PENDING", "VERIFIED", "REJECTED"),
  kyc_verified_at: Date,
  kyc_documents: [
    {
      type: enum("ID", "PROOF_OF_ADDRESS", "SELFIE"),
      document_url: string,
      uploaded_at: Date,
      verified: boolean
    }
  ],
  
  // Account Status
  is_active: boolean,
  is_banned: boolean,
  ban_reason: string,
  banned_at: Date,
  ban_until: Date,
  
  // Verification
  email_verified: boolean,
  email_verified_at: Date,
  phone_verified: boolean,
  phone_verified_at: Date,
  
  // Security
  roles: array("USER", "ADMIN", "SUPER_ADMIN"),
  two_factor_enabled: boolean,
  two_factor_method: enum("AUTHENTICATOR_APP", "SMS"),
  
  // Login Tracking
  last_login: Date,
  last_login_ip: string,
  last_login_device: string,
  failed_login_attempts: number,
  locked_until: Date,
  
  // Device Fingerprinting
  trusted_devices: [
    {
      device_id: string,
      device_name: string,
      user_agent: string,
      ip_address: string,
      trusted_at: Date,
      last_used: Date
    }
  ],
  
  // Preferences
  notification_email: boolean,
  notification_sms: boolean,
  notification_push: boolean,
  language: enum("VI", "EN"),
  currency: enum("VND", "USD"),
  
  // Timestamps
  created_at: Date,
  updated_at: Date,
  deleted_at: Date              // Soft delete
}

// Indexes
db.users.createIndex({ email: 1 }, { unique: true })
db.users.createIndex({ phone: 1 }, { unique: true, sparse: true })
db.users.createIndex({ kyc_status: 1 })
db.users.createIndex({ is_active: 1 })
db.users.createIndex({ created_at: -1 })
```

---

## 2. Wallets Collection

```typescript
db.wallets = {
  _id: ObjectId,
  
  // Ownership
  user_id: ObjectId,                // Reference to User
  
  // Basic Info
  wallet_name: string,              // "Main Wallet", "Savings", etc.
  wallet_type: enum("PRIMARY", "SECONDARY"),
  account_number: string,           // Unique per wallet
  
  // Balance & Currency
  balance: Decimal128,              // Use Decimal128 for precision
  currency: enum("VND", "USD", "EUR"),
  hold_amount: Decimal128,          // Amount on hold for pending transactions
  available_balance: Decimal128,    // balance - hold_amount (calculated)
  
  // Limits
  daily_limit: Decimal128,
  monthly_limit: Decimal128,
  daily_spent: Decimal128,          // Reset daily
  monthly_spent: Decimal128,        // Reset monthly
  daily_reset_at: Date,
  monthly_reset_at: Date,
  
  // Status
  status: enum("ACTIVE", "FROZEN", "SUSPENDED", "CLOSED"),
  closed_reason: string,
  closed_at: Date,
  
  // Settings
  is_default: boolean,
  allow_transfers: boolean,
  allow_deposits: boolean,
  allow_withdrawals: boolean,
  
  // Metadata
  description: string,
  tags: array(string),
  
  // Timestamps
  created_at: Date,
  updated_at: Date,
  closed_at: Date
}

// Indexes
db.wallets.createIndex({ user_id: 1 })
db.wallets.createIndex({ account_number: 1 }, { unique: true })
db.wallets.createIndex({ status: 1 })
db.wallets.createIndex({ created_at: -1 })
```

---

## 3. Transactions Collection

```typescript
db.transactions = {
  _id: ObjectId,
  
  // Transaction Identification
  transaction_id: string,           // Unique, business ID
  reference_code: string,           // For user reference
  
  // Parties Involved
  from_user_id: ObjectId,
  from_wallet_id: ObjectId,
  to_user_id: ObjectId,             // Optional for deposits
  to_wallet_id: ObjectId,           // Optional for deposits
  
  // Amount & Currency
  amount: Decimal128,
  currency: enum("VND", "USD", "EUR"),
  fee: Decimal128,                  // Transaction fee (default 0)
  fee_breakdown: {
    platform_fee: Decimal128,
    bank_fee: Decimal128,
    tax: Decimal128
  },
  total_amount: Decimal128,         // amount + fee
  
  // Transaction Type & Status
  type: enum(
    "TRANSFER",                     // P2P transfer
    "DEPOSIT",                      // From bank to wallet
    "WITHDRAW",                     // From wallet to bank
    "PAYMENT",                      // QR payment, bill payment
    "REFUND"
  ),
  status: enum(
    "PENDING",
    "PROCESSING",
    "SUCCESS",
    "FAILED",
    "CANCELLED",
    "PARTIAL_REFUND",
    "FULLY_REFUNDED"
  ),
  
  // Transaction Details
  description: string,
  notes: string,
  
  // Bank Integration (for deposits/withdrawals)
  bank_code: string,
  bank_name: string,
  bank_account_number: string,
  bank_reference_code: string,
  
  // Approval Workflow (optional)
  requires_approval: boolean,
  approval_status: enum("PENDING", "APPROVED", "REJECTED"),
  approved_by: ObjectId,            // Admin who approved
  approval_reason: string,
  approval_notes: string,
  
  // Error Handling
  error_code: string,
  error_message: string,
  error_timestamp: Date,
  retry_count: number,
  retry_until: Date,
  
  // Verification
  otp_verified: boolean,
  otp_verified_at: Date,
  
  // Metadata & Tracking
  ip_address: string,
  device_id: string,
  user_agent: string,
  location: {
    country: string,
    city: string,
    coordinates: {
      latitude: number,
      longitude: number
    }
  },
  
  // Reconciliation
  reconciled: boolean,
  reconciled_at: Date,
  reconciliation_notes: string,
  
  // Timestamps
  created_at: Date,
  updated_at: Date,
  completed_at: Date
}

// Indexes
db.transactions.createIndex({ transaction_id: 1 }, { unique: true })
db.transactions.createIndex({ from_user_id: 1, created_at: -1 })
db.transactions.createIndex({ to_user_id: 1, created_at: -1 })
db.transactions.createIndex({ status: 1, created_at: -1 })
db.transactions.createIndex({ type: 1 })
db.transactions.createIndex({ created_at: -1 })
db.transactions.createIndex({ 'created_at': 1 }, { expireAfterSeconds: 7776000 }) // 90 days TTL for old records
```

---

## 4. Bank Accounts Collection

```typescript
db.bank_accounts = {
  _id: ObjectId,
  
  // Ownership
  user_id: ObjectId,
  
  // Bank Information
  bank_code: string,                // ISO code or custom code
  bank_name: string,
  branch_name: string,
  
  // Account Details (Encrypted)
  account_number: string,           // Encrypted
  account_holder: string,
  account_holder_id: string,        // Encrypted (ID number)
  account_type: enum("CHECKING", "SAVING", "CREDIT"),
  
  // Verification
  is_verified: boolean,
  verification_method: enum("OTP", "DOCUMENT", "API"),
  verification_code: string,
  verification_code_attempts: number,
  verification_code_expires_at: Date,
  verified_at: Date,
  
  // Usage
  is_primary: boolean,              // Default for deposits/withdrawals
  is_active: boolean,
  
  // Limits
  daily_deposit_limit: Decimal128,
  monthly_deposit_limit: Decimal128,
  daily_withdrawal_limit: Decimal128,
  monthly_withdrawal_limit: Decimal128,
  
  // Metadata
  nickname: string,                 // User-friendly name
  
  // Timestamps
  created_at: Date,
  updated_at: Date,
  unlinked_at: Date
}

// Indexes
db.bank_accounts.createIndex({ user_id: 1 })
db.bank_accounts.createIndex({ is_verified: 1 })
db.bank_accounts.createIndex({ user_id: 1, is_primary: 1 })
```

---

## 5. Notifications Collection

```typescript
db.notifications = {
  _id: ObjectId,
  
  // Recipient
  user_id: ObjectId,
  
  // Content
  title: string,
  message: string,
  body: string,                     // Longer description
  
  // Notification Type & Action
  type: enum(
    "TRANSACTION",
    "WALLET",
    "SECURITY",
    "SYSTEM",
    "PROMOTION"
  ),
  action_type: enum(
    "TRANSACTION_CREATED",
    "TRANSACTION_COMPLETED",
    "TRANSACTION_FAILED",
    "DEPOSIT_APPROVED",
    "WITHDRAW_PROCESSED",
    "LOGIN_ALERT",
    "PASSWORD_CHANGED",
    "BALANCE_LOW",
    "PROMOTION",
    "ACCOUNT_LOCKED"
  ),
  
  // Associated Resource
  related_resource: {
    resource_type: enum("TRANSACTION", "WALLET", "USER", "ACCOUNT"),
    resource_id: ObjectId,
    link: string
  },
  
  // Status & Preferences
  is_read: boolean,
  read_at: Date,
  priority: enum("LOW", "MEDIUM", "HIGH", "CRITICAL"),
  
  // Channels
  sent_via: array(enum("IN_APP", "EMAIL", "SMS", "PUSH")),
  
  // Icon & UI
  icon: string,                     // Icon name or URL
  color: string,
  
  // Metadata
  data: object,                     // Additional data for the frontend
  
  // Timestamps
  created_at: Date,
  expires_at: Date                  // Auto-expire old notifications
}

// Indexes
db.notifications.createIndex({ user_id: 1, created_at: -1 })
db.notifications.createIndex({ user_id: 1, is_read: 1 })
db.notifications.createIndex({ created_at: -1 })
db.notifications.createIndex({ 'expires_at': 1 }, { expireAfterSeconds: 0 })
```

---

## 6. Refresh Tokens Collection

```typescript
db.refresh_tokens = {
  _id: ObjectId,
  
  // Token Info
  user_id: ObjectId,
  token_hash: string,               // Hash of the actual token
  
  // Device Info
  device_id: string,
  device_name: string,
  user_agent: string,
  ip_address: string,
  
  // Status
  is_revoked: boolean,
  revoked_at: Date,
  
  // Timestamps
  created_at: Date,
  expires_at: Date                  // TTL for token expiry
}

// Indexes
db.refresh_tokens.createIndex({ user_id: 1 })
db.refresh_tokens.createIndex({ token_hash: 1 })
db.refresh_tokens.createIndex({ 'expires_at': 1 }, { expireAfterSeconds: 0 })
```

---

## 7. OTP Records Collection

```typescript
db.otp_records = {
  _id: ObjectId,
  
  // OTP Details
  user_id: ObjectId,
  code: string,                     // 6-digit code
  type: enum(
    "EMAIL_VERIFICATION",
    "LOGIN",
    "TRANSACTION_VERIFICATION",
    "PASSWORD_RESET",
    "BANK_LINK_VERIFICATION"
  ),
  
  // Status
  is_used: boolean,
  used_at: Date,
  
  // Attempts
  verification_attempts: number,
  max_attempts: number,
  
  // Timestamps
  created_at: Date,
  expires_at: Date,                 // TTL 5-10 minutes
  
  // Metadata
  email: string,
  phone: string,
  purpose: string
}

// Indexes
db.otp_records.createIndex({ user_id: 1, type: 1 })
db.otp_records.createIndex({ 'expires_at': 1 }, { expireAfterSeconds: 0 })
db.otp_records.createIndex({ code: 1 })
```

---

## 8. Audit Logs Collection

```typescript
db.audit_logs = {
  _id: ObjectId,
  
  // Actor
  user_id: ObjectId,
  admin_id: ObjectId,               // If action by admin
  
  // Action Details
  action: enum(
    "LOGIN",
    "LOGOUT",
    "REGISTER",
    "UPDATE_PROFILE",
    "CHANGE_PASSWORD",
    "RESET_PASSWORD",
    "CREATE_WALLET",
    "DELETE_WALLET",
    "TRANSFER",
    "DEPOSIT",
    "WITHDRAW",
    "LINK_BANK",
    "UNLINK_BANK",
    "APPROVE_TRANSACTION",
    "REJECT_TRANSACTION",
    "BAN_USER",
    "UNBAN_USER",
    "ENABLE_2FA",
    "DISABLE_2FA"
  ),
  
  // Resource
  resource: enum("USER", "WALLET", "TRANSACTION", "BANK_ACCOUNT", "SYSTEM"),
  resource_id: ObjectId,
  
  // Changes
  changes: {
    field: string,
    old_value: any,
    new_value: any
  },
  
  // Status
  status: enum("SUCCESS", "FAILURE"),
  error_message: string,
  
  // Context
  ip_address: string,
  user_agent: string,
  location: {
    country: string,
    city: string
  },
  
  // Timestamps
  created_at: Date
}

// Indexes
db.audit_logs.createIndex({ user_id: 1, created_at: -1 })
db.audit_logs.createIndex({ action: 1, created_at: -1 })
db.audit_logs.createIndex({ resource: 1, resource_id: 1 })
db.audit_logs.createIndex({ created_at: -1 })
```

---

## 9. Settings Collection

```typescript
db.settings = {
  _id: ObjectId,
  
  // System Configuration
  key: string,                      // Unique key
  value: any,                       // String, number, object, array
  type: enum("STRING", "NUMBER", "BOOLEAN", "JSON"),
  description: string,
  category: enum(
    "SYSTEM",
    "SECURITY",
    "PAYMENT",
    "EMAIL",
    "SMS",
    "LIMIT",
    "FEE"
  ),
  
  // Metadata
  is_public: boolean,               // Can frontend access?
  is_encrypted: boolean,
  
  // Timestamps
  created_at: Date,
  updated_at: Date
}

// Sample Settings
{
  key: "PLATFORM_FEE_PERCENTAGE",
  value: 0.005,
  type: "NUMBER",
  category: "FEE"
}

{
  key: "MAX_DAILY_TRANSACTION_LIMIT",
  value: 100000000,
  type: "NUMBER",
  category: "LIMIT"
}

{
  key: "JWT_ACCESS_TOKEN_EXPIRY",
  value: 900,
  type: "NUMBER",
  category: "SECURITY"
}

// Indexes
db.settings.createIndex({ key: 1 }, { unique: true })
```

---

## 10. Data Relationships Diagram

```
Users (1) ─────┬─── (M) Wallets
              │
              ├─── (M) Transactions (sender)
              │
              ├─── (M) Transactions (recipient)
              │
              ├─── (M) BankAccounts
              │
              ├─── (M) Notifications
              │
              └─── (M) RefreshTokens


Wallets (1) ────┬─── (M) Transactions (from_wallet)
                │
                └─── (M) Transactions (to_wallet)
```

---

## 11. Indexing Strategy

### Performance Indexes
```typescript
// Hot queries
db.transactions.createIndex({ user_id: 1, created_at: -1 }, { background: true })
db.notifications.createIndex({ user_id: 1, is_read: 1 }, { background: true })
db.wallets.createIndex({ user_id: 1, status: 1 }, { background: true })

// Unique constraints
db.users.createIndex({ email: 1 }, { unique: true })
db.transactions.createIndex({ transaction_id: 1 }, { unique: true })

// TTL indexes for cleanup
db.refresh_tokens.createIndex({ expires_at: 1 }, { expireAfterSeconds: 0 })
db.otp_records.createIndex({ expires_at: 1 }, { expireAfterSeconds: 0 })
```

---

## 12. Data Validation Rules

### User Schema
```
- email: Required, unique, valid email format
- password_hash: Required, min 60 chars (bcrypt)
- phone: Optional, unique if provided
- kyc_status: Enum validation
```

### Wallet Schema
```
- user_id: Required, valid ObjectId reference to users
- account_number: Unique, alphanumeric
- balance: Decimal128, >= 0
- currency: Valid enum value
```

### Transaction Schema
```
- amount: Decimal128, > 0
- type: Valid enum value
- status: Valid enum value
- from_wallet_id & to_wallet_id: Valid references
```

---

## 13. MongoDB Transactions

For multi-step operations like transfers:

```typescript
const session = await mongoose.startSession();
session.startTransaction();

try {
  // Deduct from sender
  // Add to recipient
  // Create transaction record
  await session.commitTransaction();
} catch (error) {
  await session.abortTransaction();
}
```

---

## 14. Backup & Recovery Strategy

- Daily automated backups
- Point-in-time recovery (PITR) enabled
- Backup retention: 30 days
- Test restore procedures monthly
