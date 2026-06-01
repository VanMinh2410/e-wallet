# 📡 API Specification - E-Wallet Backend

## Base Configuration

```
Base URL: http://localhost:3000/api
Authentication: Bearer Token (JWT)
Content-Type: application/json
```

---

## 1. Authentication Endpoints

### 1.1 Register
```http
POST /auth/register
Content-Type: application/json

Request:
{
  "email": "user@example.com",
  "phone": "+84987654321",
  "password": "SecurePass123!",
  "first_name": "John",
  "last_name": "Doe",
  "date_of_birth": "1990-01-15"
}

Response: 201 Created
{
  "success": true,
  "message": "Registration successful. Please verify your email.",
  "data": {
    "user_id": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "verification_required": true
  }
}

Errors:
- 400: Email already exists
- 400: Invalid email format
- 400: Password too weak
- 422: Validation failed
```

### 1.2 Verify Email with OTP
```http
POST /auth/verify-email
Content-Type: application/json

Request:
{
  "email": "user@example.com",
  "otp_code": "123456"
}

Response: 200 OK
{
  "success": true,
  "message": "Email verified successfully",
  "data": {
    "user_id": "507f1f77bcf86cd799439011",
    "email_verified": true
  }
}

Errors:
- 400: Invalid OTP
- 400: OTP expired
- 404: User not found
```

### 1.3 Resend OTP
```http
POST /auth/resend-otp
Content-Type: application/json

Request:
{
  "email": "user@example.com",
  "type": "EMAIL_VERIFICATION"
}

Response: 200 OK
{
  "success": true,
  "message": "OTP sent to your email",
  "data": {
    "expires_in": 600
  }
}
```

### 1.4 Login
```http
POST /auth/login
Content-Type: application/json

Request:
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}

Response: 200 OK
{
  "success": true,
  "message": "Login successful",
  "data": {
    "access_token": "eyJhbGc...",
    "refresh_token": "eyJhbGc...",
    "expires_in": 900,
    "user": {
      "user_id": "507f1f77bcf86cd799439011",
      "email": "user@example.com",
      "roles": ["USER"]
    }
  }
}

Errors:
- 401: Invalid credentials
- 401: Email not verified
- 403: Account locked
- 404: User not found
```

### 1.5 Refresh Token
```http
POST /auth/refresh-token
Authorization: Bearer {refresh_token}

Response: 200 OK
{
  "success": true,
  "data": {
    "access_token": "eyJhbGc...",
    "expires_in": 900
  }
}

Errors:
- 401: Invalid refresh token
- 401: Refresh token expired
```

### 1.6 Logout
```http
POST /auth/logout
Authorization: Bearer {access_token}

Response: 200 OK
{
  "success": true,
  "message": "Logged out successfully"
}
```

### 1.7 Forgot Password
```http
POST /auth/forgot-password
Content-Type: application/json

Request:
{
  "email": "user@example.com"
}

Response: 200 OK
{
  "success": true,
  "message": "Password reset link sent to your email"
}
```

### 1.8 Reset Password
```http
POST /auth/reset-password
Content-Type: application/json

Request:
{
  "reset_token": "token...",
  "new_password": "NewPassword123!"
}

Response: 200 OK
{
  "success": true,
  "message": "Password reset successfully"
}

Errors:
- 400: Invalid reset token
- 400: Token expired
- 400: Password too weak
```

---

## 2. User Profile Endpoints

### 2.1 Get Profile
```http
GET /users/profile
Authorization: Bearer {access_token}

Response: 200 OK
{
  "success": true,
  "data": {
    "user_id": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "phone": "+84987654321",
    "first_name": "John",
    "last_name": "Doe",
    "date_of_birth": "1990-01-15",
    "profile_picture": "https://...",
    "kyc_status": "VERIFIED",
    "email_verified": true,
    "phone_verified": true,
    "roles": ["USER"],
    "created_at": "2024-05-15T10:30:00Z"
  }
}
```

### 2.2 Update Profile
```http
PUT /users/profile
Authorization: Bearer {access_token}
Content-Type: application/json

Request:
{
  "first_name": "John",
  "last_name": "Doe",
  "phone": "+84987654321",
  "bio": "Software engineer"
}

Response: 200 OK
{
  "success": true,
  "message": "Profile updated successfully",
  "data": { ...updated user data }
}

Errors:
- 400: Phone already exists
- 422: Validation failed
```

### 2.3 Change Password
```http
PUT /users/password
Authorization: Bearer {access_token}
Content-Type: application/json

Request:
{
  "old_password": "OldPassword123!",
  "new_password": "NewPassword123!"
}

Response: 200 OK
{
  "success": true,
  "message": "Password changed successfully"
}

Errors:
- 400: Old password incorrect
- 400: New password same as old
```

### 2.4 Upload Profile Picture
```http
POST /users/profile-picture
Authorization: Bearer {access_token}
Content-Type: multipart/form-data

Request:
- file: image file (jpg, png, max 5MB)

Response: 200 OK
{
  "success": true,
  "data": {
    "profile_picture_url": "https://..."
  }
}
```

### 2.5 Upload KYC Documents
```http
POST /users/kyc/documents
Authorization: Bearer {access_token}
Content-Type: multipart/form-data

Request:
- documents: multiple files
- document_type: "ID" | "PROOF_OF_ADDRESS" | "SELFIE"

Response: 200 OK
{
  "success": true,
  "message": "Documents uploaded for verification",
  "data": {
    "kyc_status": "PENDING"
  }
}
```

### 2.6 Get KYC Status
```http
GET /users/kyc-status
Authorization: Bearer {access_token}

Response: 200 OK
{
  "success": true,
  "data": {
    "kyc_status": "VERIFIED",
    "verified_at": "2024-05-15T10:30:00Z",
    "documents": [
      {
        "type": "ID",
        "verified": true,
        "uploaded_at": "2024-05-15T10:00:00Z"
      }
    ]
  }
}
```

---

## 3. Wallet Endpoints

### 3.1 List Wallets
```http
GET /wallets
Authorization: Bearer {access_token}

Query Parameters:
- status: ACTIVE | FROZEN | SUSPENDED
- limit: 10
- offset: 0

Response: 200 OK
{
  "success": true,
  "data": [
    {
      "wallet_id": "507f1f77bcf86cd799439012",
      "user_id": "507f1f77bcf86cd799439011",
      "wallet_name": "Main Wallet",
      "account_number": "1234567890",
      "balance": 5000000,
      "currency": "VND",
      "status": "ACTIVE",
      "is_default": true,
      "created_at": "2024-05-15T10:00:00Z"
    }
  ],
  "pagination": {
    "total": 1,
    "limit": 10,
    "offset": 0
  }
}
```

### 3.2 Create Wallet
```http
POST /wallets
Authorization: Bearer {access_token}
Content-Type: application/json

Request:
{
  "wallet_name": "Savings",
  "currency": "VND"
}

Response: 201 Created
{
  "success": true,
  "message": "Wallet created successfully",
  "data": {
    "wallet_id": "507f1f77bcf86cd799439013",
    "account_number": "0987654321",
    "balance": 0,
    "currency": "VND"
  }
}

Errors:
- 400: Wallet name already exists
- 422: Validation failed
```

### 3.3 Get Wallet Details
```http
GET /wallets/{wallet_id}
Authorization: Bearer {access_token}

Response: 200 OK
{
  "success": true,
  "data": {
    "wallet_id": "507f1f77bcf86cd799439012",
    "wallet_name": "Main Wallet",
    "account_number": "1234567890",
    "balance": 5000000,
    "available_balance": 4900000,
    "hold_amount": 100000,
    "currency": "VND",
    "daily_limit": 50000000,
    "monthly_limit": 500000000,
    "daily_spent": 100000,
    "monthly_spent": 200000,
    "status": "ACTIVE",
    "is_default": true,
    "created_at": "2024-05-15T10:00:00Z"
  }
}

Errors:
- 404: Wallet not found
- 403: Not authorized
```

### 3.4 Update Wallet
```http
PUT /wallets/{wallet_id}
Authorization: Bearer {access_token}
Content-Type: application/json

Request:
{
  "wallet_name": "Updated Name",
  "daily_limit": 60000000,
  "is_default": true
}

Response: 200 OK
{
  "success": true,
  "message": "Wallet updated successfully"
}
```

### 3.5 Delete Wallet
```http
DELETE /wallets/{wallet_id}
Authorization: Bearer {access_token}

Response: 200 OK
{
  "success": true,
  "message": "Wallet deleted successfully"
}

Errors:
- 400: Cannot delete default wallet
- 400: Wallet has pending transactions
```

---

## 4. Transaction Endpoints

### 4.1 Transfer Money
```http
POST /transactions/transfer
Authorization: Bearer {access_token}
Content-Type: application/json

Request:
{
  "from_wallet_id": "507f1f77bcf86cd799439012",
  "to_user_id": "507f1f77bcf86cd799439099",
  "to_wallet_id": "507f1f77bcf86cd799439020",
  "amount": 1000000,
  "description": "Payment for services",
  "otp_code": "123456"
}

Response: 201 Created
{
  "success": true,
  "message": "Transfer initiated successfully",
  "data": {
    "transaction_id": "TXN20240515001",
    "status": "SUCCESS",
    "amount": 1000000,
    "fee": 5000,
    "total_amount": 1005000,
    "timestamp": "2024-05-15T10:30:00Z"
  }
}

Errors:
- 400: Insufficient balance
- 400: Invalid recipient
- 400: Exceeds daily limit
- 401: Invalid OTP
- 422: Validation failed
```

### 4.2 Request Deposit
```http
POST /transactions/deposit
Authorization: Bearer {access_token}
Content-Type: application/json

Request:
{
  "wallet_id": "507f1f77bcf86cd799439012",
  "amount": 5000000,
  "bank_account_id": "507f1f77bcf86cd799439030"
}

Response: 201 Created
{
  "success": true,
  "message": "Deposit initiated",
  "data": {
    "transaction_id": "DEP20240515001",
    "status": "PENDING",
    "amount": 5000000,
    "payment_reference": "PAY20240515001",
    "deposit_account": {
      "bank_name": "Agribank",
      "account_number": "1234567890",
      "account_holder": "E-Wallet Service"
    },
    "expires_at": "2024-05-15T23:59:59Z"
  }
}
```

### 4.3 Request Withdrawal
```http
POST /transactions/withdraw
Authorization: Bearer {access_token}
Content-Type: application/json

Request:
{
  "from_wallet_id": "507f1f77bcf86cd799439012",
  "bank_account_id": "507f1f77bcf86cd799439030",
  "amount": 2000000,
  "otp_code": "123456"
}

Response: 201 Created
{
  "success": true,
  "message": "Withdrawal request submitted",
  "data": {
    "transaction_id": "WTH20240515001",
    "status": "PENDING",
    "amount": 2000000,
    "fee": 10000,
    "total_amount": 2010000,
    "estimated_completion": "2024-05-16T10:00:00Z"
  }
}

Errors:
- 400: Insufficient balance
- 400: Daily withdrawal limit exceeded
- 404: Bank account not found
```

### 4.4 Get Transaction History
```http
GET /transactions/history
Authorization: Bearer {access_token}

Query Parameters:
- wallet_id: optional
- type: TRANSFER | DEPOSIT | WITHDRAW | PAYMENT
- status: PENDING | SUCCESS | FAILED
- from_date: ISO date
- to_date: ISO date
- limit: 20
- offset: 0

Response: 200 OK
{
  "success": true,
  "data": [
    {
      "transaction_id": "TXN20240515001",
      "type": "TRANSFER",
      "status": "SUCCESS",
      "amount": 1000000,
      "fee": 5000,
      "from_wallet": { ...},
      "to_wallet": { ...},
      "description": "Payment for services",
      "created_at": "2024-05-15T10:30:00Z",
      "completed_at": "2024-05-15T10:31:00Z"
    }
  ],
  "pagination": {
    "total": 150,
    "limit": 20,
    "offset": 0
  }
}
```

### 4.5 Get Transaction Details
```http
GET /transactions/{transaction_id}
Authorization: Bearer {access_token}

Response: 200 OK
{
  "success": true,
  "data": {
    "transaction_id": "TXN20240515001",
    "reference_code": "REF123456",
    "type": "TRANSFER",
    "status": "SUCCESS",
    "amount": 1000000,
    "currency": "VND",
    "fee": 5000,
    "total_amount": 1005000,
    "from": {
      "user_id": "507f1f77bcf86cd799439011",
      "wallet_id": "507f1f77bcf86cd799439012",
      "wallet_name": "Main Wallet"
    },
    "to": {
      "user_id": "507f1f77bcf86cd799439099",
      "wallet_id": "507f1f77bcf86cd799439020",
      "wallet_name": "Savings"
    },
    "description": "Payment for services",
    "metadata": { ...},
    "created_at": "2024-05-15T10:30:00Z",
    "completed_at": "2024-05-15T10:31:00Z"
  }
}
```

### 4.6 QR Code Payment
```http
POST /transactions/qr-payment
Authorization: Bearer {access_token}
Content-Type: application/json

Request:
{
  "qr_code": "EW_1234567890",
  "amount": 500000,
  "otp_code": "123456"
}

Response: 201 Created
{
  "success": true,
  "data": {
    "transaction_id": "QRP20240515001",
    "status": "SUCCESS",
    "amount": 500000
  }
}
```

---

## 5. Bank Account Endpoints

### 5.1 Link Bank Account
```http
POST /bank-accounts
Authorization: Bearer {access_token}
Content-Type: application/json

Request:
{
  "bank_code": "AGR",
  "account_number": "1234567890",
  "account_holder": "John Doe",
  "account_holder_id": "0123456789",
  "account_type": "CHECKING"
}

Response: 201 Created
{
  "success": true,
  "message": "Bank account linked. Verification code sent to your email.",
  "data": {
    "bank_account_id": "507f1f77bcf86cd799439030",
    "status": "PENDING_VERIFICATION",
    "bank_name": "Agribank"
  }
}
```

### 5.2 List Bank Accounts
```http
GET /bank-accounts
Authorization: Bearer {access_token}

Response: 200 OK
{
  "success": true,
  "data": [
    {
      "bank_account_id": "507f1f77bcf86cd799439030",
      "bank_code": "AGR",
      "bank_name": "Agribank",
      "account_number": "****7890",
      "account_holder": "John Doe",
      "is_verified": true,
      "is_primary": true,
      "created_at": "2024-05-15T10:00:00Z"
    }
  ]
}
```

### 5.3 Verify Bank Account
```http
POST /bank-accounts/{bank_account_id}/verify
Authorization: Bearer {access_token}
Content-Type: application/json

Request:
{
  "verification_code": "123456"
}

Response: 200 OK
{
  "success": true,
  "message": "Bank account verified successfully"
}

Errors:
- 400: Invalid verification code
- 400: Verification code expired
```

### 5.4 Delete Bank Account
```http
DELETE /bank-accounts/{bank_account_id}
Authorization: Bearer {access_token}

Response: 200 OK
{
  "success": true,
  "message": "Bank account unlinked successfully"
}

Errors:
- 400: Cannot delete account with pending transactions
```

---

## 6. Notification Endpoints

### 6.1 Get Notifications
```http
GET /notifications
Authorization: Bearer {access_token}

Query Parameters:
- is_read: true | false
- type: TRANSACTION | WALLET | SECURITY
- limit: 20
- offset: 0

Response: 200 OK
{
  "success": true,
  "data": [
    {
      "notification_id": "507f1f77bcf86cd799439040",
      "title": "Transfer Complete",
      "message": "You sent $10 to John",
      "type": "TRANSACTION",
      "is_read": false,
      "related_resource": {
        "resource_type": "TRANSACTION",
        "resource_id": "TXN20240515001"
      },
      "created_at": "2024-05-15T10:30:00Z"
    }
  ]
}
```

### 6.2 Mark as Read
```http
PUT /notifications/{notification_id}/read
Authorization: Bearer {access_token}

Response: 200 OK
{
  "success": true,
  "message": "Notification marked as read"
}
```

### 6.3 Mark All as Read
```http
PUT /notifications/mark-all-read
Authorization: Bearer {access_token}

Response: 200 OK
{
  "success": true,
  "message": "All notifications marked as read"
}
```

---

## 7. Admin Endpoints

### 7.1 List Users
```http
GET /admin/users
Authorization: Bearer {access_token}

Query Parameters:
- search: email or name
- kyc_status: PENDING | VERIFIED | REJECTED
- is_active: true | false
- role: USER | ADMIN
- limit: 20
- offset: 0

Response: 200 OK
{
  "success": true,
  "data": [
    {
      "user_id": "507f1f77bcf86cd799439011",
      "email": "user@example.com",
      "kyc_status": "VERIFIED",
      "is_active": true,
      "roles": ["USER"],
      "last_login": "2024-05-15T10:00:00Z",
      "created_at": "2024-05-14T00:00:00Z"
    }
  ]
}
```

### 7.2 Ban/Unban User
```http
POST /admin/users/{user_id}/ban
Authorization: Bearer {access_token}
Content-Type: application/json

Request:
{
  "reason": "Suspicious activity"
}

Response: 200 OK
{
  "success": true,
  "message": "User banned successfully"
}
```

### 7.3 Get Transaction for Approval
```http
GET /admin/transactions/pending-approval
Authorization: Bearer {access_token}

Response: 200 OK
{
  "success": true,
  "data": [
    {
      "transaction_id": "TXN20240515001",
      "type": "WITHDRAW",
      "status": "PENDING",
      "amount": 2000000,
      "from_user": { ...},
      "requires_approval": true
    }
  ]
}
```

### 7.4 Approve Transaction
```http
POST /admin/transactions/{transaction_id}/approve
Authorization: Bearer {access_token}
Content-Type: application/json

Request:
{
  "approval_notes": "Approved after verification"
}

Response: 200 OK
{
  "success": true,
  "message": "Transaction approved"
}
```

### 7.5 Get Analytics
```http
GET /admin/analytics/overview
Authorization: Bearer {access_token}

Query Parameters:
- from_date: ISO date
- to_date: ISO date

Response: 200 OK
{
  "success": true,
  "data": {
    "total_users": 1500,
    "active_users_today": 450,
    "total_transactions": 5200,
    "total_volume": 50000000000,
    "average_transaction": 9615385,
    "platform_revenue": 250000
  }
}
```

---

## 8. Error Response Format

```json
{
  "success": false,
  "error": {
    "code": "INVALID_REQUEST",
    "message": "Validation failed",
    "details": [
      {
        "field": "email",
        "message": "Invalid email format"
      }
    ]
  }
}
```

### Common Error Codes
- `INVALID_REQUEST` - 400
- `UNAUTHORIZED` - 401
- `FORBIDDEN` - 403
- `NOT_FOUND` - 404
- `CONFLICT` - 409
- `VALIDATION_ERROR` - 422
- `INTERNAL_SERVER_ERROR` - 500

---

## 9. Rate Limiting

```
Standard endpoints: 100 requests per minute per user
Auth endpoints: 5 login attempts per minute
API quota: 10,000 requests per day per user
```

---

## 10. Pagination

All list endpoints support:
```
- limit: Items per page (default 20, max 100)
- offset: Skip items (default 0)

Response includes pagination metadata:
{
  "pagination": {
    "total": 1000,
    "limit": 20,
    "offset": 0,
    "pages": 50
  }
}
```

---

## 11. WebSocket Events

See ARCHITECTURE.md for Socket.IO events documentation.
