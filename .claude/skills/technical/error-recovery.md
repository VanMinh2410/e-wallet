# 🔄 Kỹ thuật: Error Recovery

## Các Tình huống Cần Recovery

### 1. Transaction Rollback
Khi transaction thất bại, MongoDB tự rollback. Tuy nhiên cần:
- Cập nhật Transaction record status = 'FAILED'
- Thông báo cho user qua socket/notification

### 2. Queue Job Failed
BullMQ retry tự động với exponential backoff. Sau khi hết retry:
```typescript
@OnWorkerEvent('failed')
async onFailed(job: Job, error: Error) {
  this.logger.error(`Job ${job.id} failed after ${job.attemptsMade} attempts:`, error);
  
  // Cập nhật transaction thất bại
  await this.transactionModel.findByIdAndUpdate(
    job.data.transactionId,
    { status: 'FAILED', failureReason: error.message },
  );
  
  // Thông báo user
  this.notificationGateway.emitToUser(job.data.userId, 'transaction_failed', {
    transactionId: job.data.transactionId,
    reason: 'Giao dịch thất bại sau nhiều lần thử',
  });
}
```

### 3. Socket Emit Failed
Socket emit không được throw exception và không rollback transaction:
```typescript
try {
  this.gateway.emitToUser(userId, 'event', data);
} catch (e) {
  // Log warn, không throw
  this.logger.warn('Socket emit failed, user will see update on next refresh');
}
```

### 4. Database Connection Lost
```typescript
// Mongoose tự reconnect, nhưng cần health check
mongoose.connection.on('disconnected', () => {
  logger.error('MongoDB disconnected');
});

mongoose.connection.on('reconnected', () => {
  logger.log('MongoDB reconnected');
});
```

### 5. Idempotency Recovery
Nếu client retry sau khi server crash giữa chừng:
- Dùng `reference` (idempotency key) để detect duplicate
- Kiểm tra transaction có reference đó đã tồn tại chưa
- Nếu COMPLETED → trả về kết quả cũ
- Nếu PENDING → check queue, đẩy lại nếu cần
- Nếu FAILED → thông báo thất bại

```typescript
async transferWithRecovery(dto: TransferDto) {
  // Check existing transaction với reference
  const existing = await this.transactionModel.findOne({
    reference: dto.reference,
  });
  
  if (existing) {
    if (existing.status === 'COMPLETED') return existing;
    if (existing.status === 'FAILED') throw new BadRequestException('Giao dịch trước đó thất bại');
    // PENDING → đang xử lý
    return { message: 'Giao dịch đang xử lý' };
  }
  
  return this.transfer(dto);
}
```
