# 🔍 Prompt: Giải thích Lỗi

## Khi nào dùng prompt này
Khi AI phân tích lỗi và cần giải thích rõ ràng cho developer.

## Cấu trúc Giải thích

```
**Lỗi**: [Tên/loại lỗi]

**Nguyên nhân**: [Giải thích tại sao lỗi xảy ra]

**Cách khắc phục**:
[Code fix cụ thể]

**Giải thích**:
[Tại sao fix này hoạt động]

**Phòng tránh trong tương lai**:
- [Gợi ý 1]
- [Gợi ý 2]
```

## Ví dụ Cụ thể

### Ví dụ 1: MongoServerError Transaction
**Error log**:
```
MongoServerError: Transaction numbers are only allowed on a replica member or mongos
```

**AI giải thích**:
> **Lỗi**: MongoDB Transaction không được hỗ trợ
>
> **Nguyên nhân**: MongoDB chỉ hỗ trợ multi-document transaction khi đang chạy với Replica Set hoặc Sharded Cluster. Instance standalone (như docker `mongo` mà không có `--replSet`) không hỗ trợ.
>
> **Cách khắc phục**:
> ```yaml
> # docker-compose.yml – thêm --replSet
> mongodb:
>   image: mongo:7
>   command: --replSet rs0  # ← Thêm dòng này
>
> # Sau đó init replica set
> mongo-init:
>   image: mongo:7
>   command: mongosh --host mongodb --eval "rs.initiate()"
> ```
>
> **Giải thích**: `--replSet rs0` khởi động MongoDB trong chế độ replica set. Khi chạy `rs.initiate()`, node tự đóng vai trò PRIMARY và hỗ trợ transaction.
>
> **Phòng tránh**: Luôn dùng docker-compose với replica set từ đầu dự án. Xem: `skills/technical/mongodb-transaction.md`.

### Ví dụ 2: JWT TokenExpiredError
**Error**:
```
JsonWebTokenError: jwt expired
```

**AI giải thích**:
> **Lỗi**: Access Token đã hết hạn (TTL 15 phút)
>
> **Nguyên nhân**: Client dùng access token sau khi nó hết hạn mà không refresh.
>
> **Cách khắc phục** (Frontend):
> ```typescript
> // Implement silent refresh với Axios interceptor
> // Xem: skills/technical/jwt-refresh-token.md
> ```
>
> **Phòng tránh**: Implement refresh token interceptor đầy đủ ở bước khởi đầu dự án.

## Nguyên tắc Giải thích

- ✅ Giải thích nguyên nhân gốc rễ (root cause), không chỉ symptom
- ✅ Cung cấp code fix cụ thể, có thể sử dụng ngay
- ✅ Liên kết đến tài liệu liên quan trong `skills/technical/`
- ✅ Đề xuất cách phòng tránh trong tương lai
- ❌ Không nói "đơn giản thôi" hay "chỉ cần..." – mọi lỗi đều có lý do
