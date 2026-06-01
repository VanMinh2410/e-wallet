# 📝 Frontend Flow: Đăng ký

## Màn hình: `/register`

## Luồng

```
Step 1: Thông tin cơ bản
  → Họ tên, email, số điện thoại, mật khẩu, xác nhận mật khẩu
  → Validate realtime
  → Nhấn "Tiếp tục"

Step 2: Xác minh OTP
  → Nhập mã OTP 6 số gửi qua email/SMS
  → Countdown 120 giây
  → Nút "Gửi lại" sau khi hết giờ
  → Nhấn "Xác nhận"

Step 3: Hoàn tất
  → "Đăng ký thành công!" 
  → Tự động login và redirect /dashboard
```

## Validation

```typescript
const registerSchema = z.object({
  fullName: z.string().min(2, 'Họ tên phải có ít nhất 2 ký tự').max(50),
  email: z.string().email('Email không hợp lệ'),
  phone: z.string().regex(/^(0|\\+84)[3-9]\\d{8}$/, 'Số điện thoại không hợp lệ'),
  password: z.string()
    .min(8, 'Mật khẩu phải có ít nhất 8 ký tự')
    .regex(/(?=.*[A-Z])(?=.*\\d)/, 'Phải có ít nhất 1 chữ hoa và 1 số'),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Mật khẩu xác nhận không khớp',
  path: ['confirmPassword'],
});
```

## API Calls

```typescript
// POST /api/v1/auth/register
// POST /api/v1/auth/verify-otp
// POST /api/v1/auth/resend-otp
```

## Edge Cases

- Email/phone đã tồn tại → thông báo rõ ràng
- OTP sai 5 lần → khóa 5 phút
- OTP hết hạn → cho phép gửi lại
