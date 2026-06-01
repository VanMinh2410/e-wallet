# ⬆️ Backend Flow: Rút tiền

## Endpoint

```
POST /api/v1/wallets/me/withdraw
Authorization: Bearer <token>
```

## DTO

```typescript
export class WithdrawDto {
  @IsNumber()
  @Min(50000, { message: 'Rút tối thiểu 50.000đ' })
  amount: number;

  @IsMongoId()
  bankAccountId: string; // ID tài khoản ngân hàng đã liên kết
}
```

## Luồng Rút tiền

```
1. Validate input
2. Kiểm tra balance >= amount + fee
3. MongoDB Transaction:
   - Trừ balance ngay (HOLD)
   - Tạo Transaction record (status: PENDING)
4. Đẩy BullMQ job
5. Return { transactionId, status: 'PENDING' }
6. BullMQ worker:
   - Gọi banking API để chuyển tiền
   - Thành công → Transaction status = COMPLETED
   - Thất bại → Hoàn tiền + Transaction status = FAILED
```

## Hoàn tiền khi thất bại

```typescript
async handleWithdrawFailed(transactionId: string, walletId: string, amount: number) {
  const session = await this.connection.startSession();
  session.startTransaction();
  try {
    // Hoàn tiền về ví
    await this.walletModel.findByIdAndUpdate(
      walletId,
      { $inc: { balance: amount } },
      { session },
    );
    // Cập nhật transaction
    await this.transactionModel.findByIdAndUpdate(
      transactionId,
      { status: 'REFUNDED', completedAt: new Date() },
      { session },
    );
    await session.commitTransaction();
    
    // Thông báo
    this.gateway.emitToUser(userId, 'withdraw_failed', {
      transactionId,
      message: 'Rút tiền thất bại, số tiền đã được hoàn về ví',
    });
  } catch (e) {
    await session.abortTransaction();
    throw e;
  } finally {
    await session.endSession();
  }
}
```
