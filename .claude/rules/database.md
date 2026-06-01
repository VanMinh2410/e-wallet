# 🗄️ Quy tắc: Database

## 1. MongoDB Transaction (Bắt buộc)

**MỌI thao tác ghi đồng thời PHẢI dùng transaction:**

```typescript
const session = await this.connection.startSession();
session.startTransaction();
try {
  await this.walletModel.findByIdAndUpdate(
    fromWalletId,
    { $inc: { balance: -amount } },
    { session, new: true }
  );
  await this.walletModel.findByIdAndUpdate(
    toWalletId,
    { $inc: { balance: amount } },
    { session }
  );
  await this.transactionModel.create([{ ... }], { session });
  await session.commitTransaction();
} catch (error) {
  await session.abortTransaction();
  throw error;
} finally {
  await session.endSession();
}
```

**Điều kiện bắt buộc dùng transaction:**
- Chuyển khoản (debit + credit đồng thời)
- Nạp tiền (cập nhật balance + tạo transaction record)
- Rút tiền (kiểm tra balance + cập nhật + tạo record)
- Bất kỳ thao tác nào ghi vào ≥ 2 document

## 2. Schema Conventions

### Luôn có timestamps
```typescript
@Schema({ timestamps: true })
export class Wallet {}
// Tự động thêm createdAt, updatedAt
```

### Luôn validate ở schema level
```typescript
@Schema()
export class Wallet {
  @Prop({ required: true, min: 0 })
  balance: number; // Không bao giờ < 0
}
```

### Dùng ObjectId ref thay vì embed document lớn
```typescript
@Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
userId: Types.ObjectId;
```

## 3. Indexes Bắt buộc

```typescript
// Wallet
walletSchema.index({ userId: 1 }, { unique: true });
walletSchema.index({ isActive: 1 });

// Transaction
transactionSchema.index({ fromWalletId: 1, createdAt: -1 });
transactionSchema.index({ toWalletId: 1, createdAt: -1 });
transactionSchema.index({ reference: 1 }, { unique: true, sparse: true });
transactionSchema.index({ status: 1, createdAt: -1 });

// User
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ phone: 1 }, { unique: true });
```

## 4. Lưu Tiền Tệ

- **LUÔN** lưu balance dạng **integer** (VND)
- Không bao giờ dùng `float` cho tiền tệ
- Tránh floating point error:
  ```typescript
  // Sai
  balance: 50000.50
  
  // Đúng
  balance: 50000 // VND nguyên
  ```

## 5. Soft Delete

- Không xóa document quan trọng (user, wallet, transaction)
- Dùng `isActive: false` thay vì xóa
- Transaction records: KHÔNG BAO GIỜ xóa (audit trail)

## 6. Optimistic Locking

Dùng version field để tránh race condition:
```typescript
@Prop({ default: 0 })
__v: number;

// Update với điều kiện version
await this.walletModel.findOneAndUpdate(
  { _id: walletId, __v: currentVersion },
  { $inc: { balance: amount, __v: 1 } },
  { session }
);
```

## 7. Query Best Practices

```typescript
// Tốt – chỉ lấy field cần thiết
await this.walletModel.findById(id).select('balance isActive').lean();

// Tránh – lấy toàn bộ document
await this.walletModel.findById(id);

// Tốt – pagination
await this.transactionModel
  .find({ walletId })
  .sort({ createdAt: -1 })
  .skip((page - 1) * limit)
  .limit(limit)
  .lean();
```

## 8. Replica Set

- MongoDB PHẢI chạy với Replica Set (tối thiểu 1 node) để hỗ trợ transaction
- Connection string: `mongodb://host:27017/hki-wallet?replicaSet=rs0`
- Kiểm tra: `rs.status()` trong mongosh
