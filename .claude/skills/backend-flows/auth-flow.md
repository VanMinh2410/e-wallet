# 🔐 Backend Flow: Authentication

## Endpoints

| Method | URL | Mô tả |
|---|---|---|
| POST | /api/v1/auth/register | Đăng ký tài khoản |
| POST | /api/v1/auth/login | Đăng nhập |
| POST | /api/v1/auth/refresh | Làm mới access token |
| POST | /api/v1/auth/logout | Đăng xuất |
| POST | /api/v1/auth/verify-otp | Xác minh OTP |
| POST | /api/v1/auth/forgot-password | Quên mật khẩu |
| POST | /api/v1/auth/reset-password | Đặt lại mật khẩu |

## Flow: Đăng nhập

```
POST /auth/login
  → LocalAuthGuard (Passport local strategy)
  → Validate email + password với bcrypt
  → Kiểm tra user isActive
  → Tạo accessToken (15 phút) + refreshToken (7 ngày)
  → Lưu hash(refreshToken) vào Redis: rt:<userId>
  → Set refreshToken vào HttpOnly Cookie
  → Return { accessToken }
```

## Flow: Đăng ký

```
POST /auth/register
  → Validate DTO (email, phone, password)
  → Kiểm tra email + phone chưa tồn tại
  → Hash password với bcrypt (saltRounds=12)
  → Tạo User + Wallet trong MongoDB Transaction
  → Gửi OTP qua email (BullMQ notification queue)
  → Return { message: 'Vui lòng xác minh email' }
```

## DTO

```typescript
// login.dto.ts
export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;
}

// register.dto.ts
export class RegisterDto {
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  fullName: string;

  @IsEmail()
  email: string;

  @Matches(/^(0|\+84)[3-9]\d{8}$/)
  phone: string;

  @IsString()
  @MinLength(8)
  @Matches(/(?=.*[A-Z])(?=.*\d)/)
  password: string;
}
```

## Guards

```typescript
// Tất cả route cần auth
@UseGuards(JwtAuthGuard)

// Rate limit cho auth endpoints
@UseGuards(ThrottlerGuard)
@Throttle({ default: { limit: 5, ttl: 60000 } })
```

## JWT Strategy

```typescript
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_ACCESS_SECRET,
      ignoreExpiration: false,
    });
  }

  async validate(payload: JwtPayload) {
    return { userId: payload.sub, email: payload.email };
  }
}
```
