# 🌐 Kỹ thuật: Redis Cache Strategy

## Các Use Case Redis trong HKi Wallet

| Use Case | Key Pattern | TTL | Ghi chú |
|---|---|---|---|
| Refresh Token | `rt:<userId>` | 7 ngày | Hash bcrypt |
| Rate limit | `rl:<ip>:<endpoint>` | 1 phút | Counter |
| Idempotency | `idem:<reference>` | 24 giờ | JSON response |
| OTP | `otp:<email>` | 10 phút | Mã số 6 chữ số |
| Session blacklist | `bl:<jti>` | 15 phút | Void value |
| Queue jobs | BullMQ tự quản lý | - | |

## Pattern Chuẩn

```typescript
// cache.service.ts
@Injectable()
export class CacheService {
  constructor(@InjectRedis() private readonly redis: Redis) {}

  async get<T>(key: string): Promise<T | null> {
    const value = await this.redis.get(key);
    if (!value) return null;
    return JSON.parse(value) as T;
  }

  async set(key: string, value: any, ttlSeconds: number): Promise<void> {
    await this.redis.setex(key, ttlSeconds, JSON.stringify(value));
  }

  async del(key: string): Promise<void> {
    await this.redis.del(key);
  }

  async exists(key: string): Promise<boolean> {
    return (await this.redis.exists(key)) === 1;
  }
}
```

## Cache-Aside Pattern

```typescript
async getWalletInfo(walletId: string): Promise<WalletInfo> {
  const cacheKey = `wallet:info:${walletId}`;
  
  // 1. Thử lấy từ cache
  const cached = await this.cacheService.get<WalletInfo>(cacheKey);
  if (cached) return cached;
  
  // 2. Cache miss → lấy từ DB
  const wallet = await this.walletModel.findById(walletId).lean();
  if (!wallet) throw new NotFoundException('Ví không tồn tại');
  
  // 3. Lưu vào cache
  await this.cacheService.set(cacheKey, wallet, 300); // 5 phút
  
  return wallet;
}

// Khi update wallet → xóa cache
async updateWallet(walletId: string, data: Partial<Wallet>) {
  await this.walletModel.findByIdAndUpdate(walletId, data);
  await this.cacheService.del(`wallet:info:${walletId}`); // Invalidate
}
```

## Idempotency với Redis

```typescript
async transferWithIdempotency(dto: TransferDto, reference: string) {
  const idemKey = `idem:transfer:${reference}`;
  
  // Kiểm tra đã xử lý chưa
  const existingResult = await this.cacheService.get(idemKey);
  if (existingResult) {
    this.logger.log(`Idempotent request: ${reference}`);
    return existingResult; // Trả về kết quả cũ
  }
  
  // Xử lý lần đầu
  const result = await this.transfer(dto);
  
  // Lưu kết quả với TTL 24h
  await this.cacheService.set(idemKey, result, 24 * 60 * 60);
  
  return result;
}
```

## KHÔNG Cache gì

- Balance hiện tại (phải realtime)
- Danh sách transaction PENDING
- Access Token (dùng JWT verify stateless)
- Thông tin nhạy cảm (password hash, raw token)
