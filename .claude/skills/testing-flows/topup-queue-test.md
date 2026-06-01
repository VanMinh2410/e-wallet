# 🔄 Testing Flow: Topup Queue Test

## Test Suite: TopupProcessor

### TC-Q001: Job xử lý thành công
```typescript
it('nên tăng balance khi job topup thành công', async () => {
  const wallet = await createWallet({ balance: 0 });
  const tx = await createTransaction({ walletId: wallet._id, status: 'PENDING', amount: 100000 });
  
  // Mock payment gateway verify
  jest.spyOn(paymentGateway, 'verify').mockResolvedValue(true);
  
  await topupProcessor.process(createJob({
    transactionId: tx._id.toString(),
    walletId: wallet._id.toString(),
    amount: 100000,
    userId: user._id.toString(),
  }));
  
  const updatedWallet = await walletModel.findById(wallet._id);
  const updatedTx = await transactionModel.findById(tx._id);
  
  expect(updatedWallet.balance).toBe(100000);
  expect(updatedTx.status).toBe('COMPLETED');
});
```

### TC-Q002: Job thất bại khi verify payment fail
```typescript
it('nên đánh dấu FAILED khi payment không hợp lệ', async () => {
  jest.spyOn(paymentGateway, 'verify').mockResolvedValue(false);
  
  await expect(
    topupProcessor.process(createJob(jobData))
  ).rejects.toThrow();
  
  const tx = await transactionModel.findById(jobData.transactionId);
  expect(tx.status).toBe('FAILED');
  expect(tx.balance).toBe(0); // Không tăng balance
});
```

### TC-Q003: Retry logic
```typescript
it('nên retry khi job thất bại lần đầu', async () => {
  const queue = new Queue('topup', { connection });
  
  // Lần 1 fail, lần 2 OK
  jest.spyOn(paymentGateway, 'verify')
    .mockRejectedValueOnce(new Error('Gateway timeout'))
    .mockResolvedValueOnce(true);
  
  await queue.add('process-topup', jobData, { attempts: 3 });
  
  // Chờ job hoàn thành
  await waitForJob(queue, 5000);
  
  const tx = await transactionModel.findById(jobData.transactionId);
  expect(tx.status).toBe('COMPLETED');
});
```

### TC-Q004: Idempotency – cùng job ID không xử lý 2 lần
```typescript
it('nên bỏ qua khi job đã hoàn thành trước đó', async () => {
  // Tạo transaction đã COMPLETED
  const completedTx = await createTransaction({ status: 'COMPLETED', amount: 100000 });
  const wallet = await createWallet({ balance: 100000 });
  
  const spy = jest.spyOn(walletModel, 'findByIdAndUpdate');
  
  await topupProcessor.process(createJob({
    transactionId: completedTx._id.toString(),
    walletId: wallet._id.toString(),
  }));
  
  // Không gọi update balance nữa
  expect(spy).not.toHaveBeenCalled();
  
  // Balance không thay đổi
  const walletAfter = await walletModel.findById(wallet._id);
  expect(walletAfter.balance).toBe(100000);
});
```
