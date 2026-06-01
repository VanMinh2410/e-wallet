# 🔑 Kỹ thuật: JWT Refresh Token

## Kiến trúc

```
[Client]
  ├── Access Token → lưu trong memory (biến JS)
  └── Refresh Token → lưu trong HttpOnly Cookie

[Server]
  ├── Verify Access Token → JWT verify (stateless)
  └── Verify Refresh Token → kiểm tra trong Redis (stateful – có thể revoke)
```

## Luồng Hoạt động

```
1. Login thành công:
   → Server tạo: accessToken (15 phút) + refreshToken (7 ngày)
   → Lưu refreshToken vào Redis: key=rt:<userId>, value=hash(token), TTL=7 ngày
   → Set refreshToken vào HttpOnly Cookie
   → Trả về accessToken trong response body

2. Client gọi API:
   → Gửi accessToken trong Authorization header
   → Server verify JWT → OK → xử lý request

3. Access Token hết hạn:
   → Client nhận 401
   → Client tự động gọi POST /auth/refresh (silent refresh)
   → Gửi kèm Cookie (có refreshToken)
   → Server kiểm tra refreshToken hợp lệ trong Redis
   → Tạo cặp token mới (Refresh Token Rotation)
   → Trả về accessToken mới
   → Set refreshToken mới vào Cookie

4. Logout:
   → Xóa refreshToken khỏi Redis
   → Clear Cookie phía client
   → Client xóa accessToken khỏi memory
```

## Implementation

### auth.service.ts
```typescript
@Injectable()
export class AuthService {
  constructor(
    @InjectRedis() private readonly redis: Redis,
    private readonly jwtService: JwtService,
  ) {}

  async login(user: UserDocument) {
    const payload = { sub: user._id, email: user.email };
    
    const accessToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_ACCESS_SECRET,
      expiresIn: '15m',
    });
    
    const refreshToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_REFRESH_SECRET,
      expiresIn: '7d',
    });
    
    // Lưu hash của refreshToken vào Redis (không lưu raw token)
    const hashedRT = await bcrypt.hash(refreshToken, 10);
    await this.redis.setex(
      `rt:${user._id}`,
      7 * 24 * 60 * 60, // 7 ngày (giây)
      hashedRT,
    );
    
    return { accessToken, refreshToken };
  }

  async refreshTokens(userId: string, refreshToken: string) {
    // Lấy hash từ Redis
    const storedHash = await this.redis.get(`rt:${userId}`);
    if (!storedHash) throw new UnauthorizedException('Phiên đăng nhập đã hết hạn');
    
    // Kiểm tra hash khớp
    const isValid = await bcrypt.compare(refreshToken, storedHash);
    if (!isValid) throw new UnauthorizedException('Refresh token không hợp lệ');
    
    // Refresh Token Rotation – tạo token mới, xóa token cũ
    const user = await this.usersService.findById(userId);
    return this.login(user);
  }

  async logout(userId: string) {
    await this.redis.del(`rt:${userId}`);
  }
}
```

### auth.controller.ts
```typescript
@Controller('auth')
export class AuthController {
  @Post('login')
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const user = await this.authService.validateUser(dto.email, dto.password);
    const { accessToken, refreshToken } = await this.authService.login(user);
    
    // Set refreshToken vào HttpOnly Cookie
    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 ngày (ms)
      path: '/api/auth', // Chỉ gửi cho /api/auth
    });
    
    return { accessToken }; // Chỉ trả về accessToken trong body
  }

  @Post('refresh')
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req.cookies['refresh_token'];
    if (!refreshToken) throw new UnauthorizedException();
    
    // Verify và decode RT để lấy userId
    const payload = this.jwtService.verify(refreshToken, {
      secret: process.env.JWT_REFRESH_SECRET,
    });
    
    const { accessToken, refreshToken: newRT } = await this.authService.refreshTokens(
      payload.sub,
      refreshToken,
    );
    
    res.cookie('refresh_token', newRT, { /* same options */ });
    return { accessToken };
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  async logout(@User() user: JwtPayload, @Res({ passthrough: true }) res: Response) {
    await this.authService.logout(user.sub);
    res.clearCookie('refresh_token');
    return { message: 'Đăng xuất thành công' };
  }
}
```

## Frontend – Silent Refresh

```typescript
// api.ts – Axios interceptor tự động refresh
let isRefreshing = false;
let failedQueue: Array<{ resolve: Function; reject: Function }> = [];

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers['Authorization'] = `Bearer ${token}`;
          return api(originalRequest);
        });
      }
      
      originalRequest._retry = true;
      isRefreshing = true;
      
      try {
        const { data } = await api.post('/auth/refresh');
        const newToken = data.data.accessToken;
        
        // Cập nhật token trong memory
        store.dispatch(setAccessToken(newToken));
        
        // Retry tất cả request đang chờ
        failedQueue.forEach(({ resolve }) => resolve(newToken));
        failedQueue = [];
        
        originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch {
        failedQueue.forEach(({ reject }) => reject(error));
        failedQueue = [];
        store.dispatch(logout());
        window.location.href = '/login';
      } finally {
        isRefreshing = false;
      }
    }
    
    return Promise.reject(error);
  },
);
```
