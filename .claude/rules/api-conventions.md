# 🌐 Quy tắc: API Conventions

## Nguyên tắc chung
- RESTful API
- Versioned: `/api/v1/...`
- JSON request/response
- HTTPS bắt buộc trên mọi môi trường (kể cả staging)

## URL Naming

```
# Đúng – kebab-case, danh từ số nhiều, lowercase
GET    /api/v1/wallets
GET    /api/v1/wallets/:id
POST   /api/v1/wallets/:id/transfers
GET    /api/v1/transactions
GET    /api/v1/transactions/:id

# Sai
GET    /api/v1/getWallet
POST   /api/v1/createTransfer
GET    /api/v1/Transaction_List
```

## HTTP Methods

| Method | Mục đích | Idempotent |
|---|---|---|
| GET | Đọc dữ liệu | ✅ |
| POST | Tạo mới | ❌ |
| PUT | Thay thế hoàn toàn | ✅ |
| PATCH | Cập nhật một phần | ✅ |
| DELETE | Xóa | ✅ |

## HTTP Status Codes

| Code | Tình huống |
|---|---|
| 200 | Thành công (GET, PUT, PATCH) |
| 201 | Tạo thành công (POST) |
| 204 | Thành công, không có data trả về (DELETE) |
| 400 | Bad Request – input không hợp lệ |
| 401 | Unauthorized – chưa đăng nhập |
| 403 | Forbidden – không có quyền |
| 404 | Not Found |
| 409 | Conflict – dữ liệu trùng lặp |
| 422 | Unprocessable Entity – validation fail |
| 429 | Too Many Requests – rate limit |
| 500 | Internal Server Error |
| 503 | Service Unavailable |

## Response Format Chuẩn

### Thành công
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Chuyển khoản thành công",
  "data": {
    "transactionId": "tx_abc123",
    "amount": 50000,
    "balance": 450000
  }
}
```

### Lỗi
```json
{
  "success": false,
  "statusCode": 400,
  "message": "Số dư không đủ để thực hiện giao dịch",
  "error": {
    "code": "INSUFFICIENT_BALANCE",
    "details": null
  }
}
```

### Danh sách (có phân trang)
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Lấy danh sách giao dịch thành công",
  "data": {
    "items": [...],
    "meta": {
      "total": 150,
      "page": 1,
      "limit": 10,
      "totalPages": 15
    }
  }
}
```

## Pagination Parameters

```
GET /api/v1/transactions?page=1&limit=10&sortBy=createdAt&sortOrder=desc
```

- `page`: trang hiện tại (mặc định: 1)
- `limit`: số item mỗi trang (mặc định: 10, tối đa: 100)
- `sortBy`: field để sort
- `sortOrder`: `asc` hoặc `desc`

## Error Codes Chuẩn

```typescript
enum ErrorCode {
  INSUFFICIENT_BALANCE = 'INSUFFICIENT_BALANCE',
  WALLET_NOT_FOUND = 'WALLET_NOT_FOUND',
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  INVALID_TOKEN = 'INVALID_TOKEN',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  DUPLICATE_TRANSACTION = 'DUPLICATE_TRANSACTION',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  TRANSACTION_FAILED = 'TRANSACTION_FAILED',
}
```

## Headers Bắt buộc

```
Authorization: Bearer <access_token>
Content-Type: application/json
X-Request-ID: <uuid>      # Tracing
X-Idempotency-Key: <uuid> # Cho POST payment API
```
