# 🔒 Quy tắc: Bảo mật (Security)

## 1. Xác thực & Phân quyền

### JWT
- **Access Token**: TTL 15 phút, lưu trong memory (biến JS), KHÔNG localStorage
- **Refresh Token**: TTL 7 ngày, lưu `HttpOnly + Secure + SameSite=Strict Cookie`
- Refresh Token phải lưu trong Redis để có thể revoke
- Khi logout: xóa RT khỏi Redis VÀ cookie ngay lập tức
- Không bao giờ decode JWT phía frontend để lấy thông tin sensitive

### Password
- Dùng bcrypt với saltRounds = 12
- Không log, không trả về, không lưu plaintext password
- Implement forgot password với OTP có TTL 10 phút (lưu Redis)

### API Auth
```typescript
// Áp dụng cho mọi endpoint nhạy cảm
@UseGuards(JwtAuthGuard)
@Controller('wallets')
export class WalletController {}
```

## 2. Rate Limiting

| Endpoint | Giới hạn | Window |
|---|---|---|
| POST /auth/login | 5 request | 1 phút |
| POST /auth/register | 3 request | 1 phút |
| POST /auth/refresh | 10 request | 1 phút |
| POST /wallets/:id/transfers | 10 request | 1 phút |
| POST /wallets/:id/topup | 5 request | 1 phút |
| GET /transactions | 30 request | 1 phút |

```typescript
// Cài đặt trong NestJS
@UseGuards(ThrottlerGuard)
@Throttle({ default: { limit: 5, ttl: 60000 } })
@Post('login')
async login() {}
```

## 3. Input Validation

- **LUÔN** validate input bằng class-validator + class-transformer
- Whitelist: chỉ nhận field đã khai báo trong DTO (`whitelist: true`)
- Forbid extra: reject nếu có field không khai báo (`forbidNonWhitelisted: true`)

```typescript
// Global validation pipe
app.useGlobalPipes(new ValidationPipe({
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true,
}));
```

## 4. Injection Prevention

- Không bao giờ xây dựng query MongoDB từ string user input
- Luôn dùng Mongoose methods và typed queries
- Sanitize tất cả user input với `@IsString()`, `@IsNumber()`, v.v.

## 5. CORS

```typescript
app.enableCors({
  origin: process.env.FRONTEND_URL, // Không dùng '*' trên production
  credentials: true, // Cho phép cookie
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
});
```

## 6. Security Headers

```typescript
// Dùng helmet middleware
import helmet from 'helmet';
app.use(helmet());
```

Headers bắt buộc:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Content-Security-Policy`
- `Strict-Transport-Security`

## 7. Data Sensitivity

**KHÔNG BAO GIỜ log hoặc return:**
- Passwords (dù đã hash)
- Refresh Token đầy đủ
- MongoDB connection string
- Internal IP addresses
- Stack trace (trong production)

**Mask khi log:**
- Số điện thoại: `0901***456`
- Email: `use***@gmail.com`
- Số tài khoản: `****1234`

## 8. Idempotency

API tạo giao dịch phải hỗ trợ idempotency:
```typescript
// Client gửi header X-Idempotency-Key
// Server kiểm tra key trong Redis
// Nếu đã xử lý → trả về kết quả cũ
// Nếu chưa → xử lý và lưu kết quả với TTL 24h
```

## 9. Encryption at Rest

- Lưu dữ liệu nhạy cảm (số CMND, số thẻ) dưới dạng encrypted
- Dùng AES-256-GCM
- Không bao giờ lưu key trong code (dùng environment variable)

## 10. Audit Log

Mọi thao tác liên quan đến tiền phải được log:
```typescript
{
  userId: string,
  action: 'TRANSFER' | 'TOPUP' | 'WITHDRAW',
  amount: number,
  ip: string,
  userAgent: string,
  timestamp: Date,
  result: 'SUCCESS' | 'FAILED',
}
```
