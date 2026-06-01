# 🔐 Frontend Flow: Đăng nhập

## Màn hình: `/login`

## Luồng Người dùng

```
[Màn hình Login]
  → Nhập email + password
  → Nhấn "Đăng nhập"
  → Loading state
  → [Thành công] → Redirect /dashboard
  → [Thất bại] → Hiển thị lỗi
```

## State Management

```typescript
// authSlice.ts
interface AuthState {
  accessToken: string | null;  // Lưu trong memory
  user: UserInfo | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
```

## API Call

```typescript
// POST /api/v1/auth/login
// Body: { email, password }
// Response: { accessToken } + Set-Cookie: refresh_token

const useLogin = () => {
  return useMutation({
    mutationFn: async (credentials: LoginCredentials) => {
      const response = await api.post('/auth/login', credentials);
      return response.data.data;
    },
    onSuccess: (data) => {
      // Lưu accessToken trong Redux store (memory)
      dispatch(setAccessToken(data.accessToken));
      dispatch(fetchUserProfile());
      navigate('/dashboard');
    },
    onError: (error: ApiError) => {
      const code = error.response?.data?.error?.code;
      if (code === 'INVALID_CREDENTIALS') {
        setError('Email hoặc mật khẩu không đúng');
      } else if (code === 'RATE_LIMIT_EXCEEDED') {
        setError('Đăng nhập quá nhiều lần. Vui lòng thử lại sau 1 phút');
      } else {
        setError('Có lỗi xảy ra, vui lòng thử lại');
      }
    },
  });
};
```

## Form Validation (Zod)

```typescript
const loginSchema = z.object({
  email: z.string().email('Email không hợp lệ'),
  password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
});
```

## Xử lý Trạng thái

| Trạng thái | Hiển thị |
|---|---|
| Loading | Button disabled + spinner |
| Error (credentials) | Alert đỏ dưới form |
| Error (rate limit) | Alert cảnh báo + countdown |
| Success | Redirect /dashboard |

## Bảo mật

- KHÔNG lưu email/password sau khi submit
- Clear form error khi user bắt đầu gõ lại
- Disable button khi đang loading (tránh double submit)
- Redirect về `/dashboard` nếu đã đăng nhập
