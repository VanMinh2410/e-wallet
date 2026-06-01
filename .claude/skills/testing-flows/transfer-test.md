# 🧪 Testing Flow: Transfer Test Cases

## Test Suite: WalletService.transfer()

### TC-001: Chuyển khoản thành công
```typescript
it('nên trả về transaction khi chuyển khoản thành công', async () => {
  // Arrange
  const fromWallet = await createWallet({ balance: 100000 });
  const toWallet = await createWallet({ balance: 0 });
  const dto = { fromWalletId: fromWallet._id, toWalletId: toWallet._id, amount: 50000 };

  // Act
  const result = await walletService.transfer(dto);

  // Assert
  expect(result.status).toBe('COMPLETED');
  expect(result.amount).toBe(50000);
  
  const updatedFrom = await walletModel.findById(fromWallet._id);
  const updatedTo = await walletModel.findById(toWallet._id);
  expect(updatedFrom.balance).toBe(50000);
  expect(updatedTo.balance).toBe(50000);
});
```

### TC-002: Số dư không đủ
```typescript
it('nên throw InsufficientBalanceException khi số dư không đủ', async () => {
  // Arrange
  const fromWallet = await createWallet({ balance: 10000 });
  const toWallet = await createWallet({ balance: 0 });

  // Act & Assert
  await expect(
    walletService.transfer({ ...dto, amount: 50000 })
  ).rejects.toThrow('Số dư không đủ');
  
  // Kiểm tra balance không thay đổi
  const unchanged = await walletModel.findById(fromWallet._id);
  expect(unchanged.balance).toBe(10000);
});
```

### TC-003: Transaction rollback khi lỗi
```typescript
it('nên rollback transaction khi có lỗi giữa chừng', async () => {
  // Mock lỗi khi cập nhật toWallet
  jest.spyOn(walletModel, 'findByIdAndUpdate')
    .mockResolvedValueOnce(debitedWallet)    // debit OK
    .mockRejectedValueOnce(new Error('DB Error')); // credit FAIL

  await expect(walletService.transfer(dto)).rejects.toThrow();
  
  // Verify balance không thay đổi (rollback thành công)
  const fromWalletAfter = await walletModel.findById(dto.fromWalletId);
  expect(fromWalletAfter.balance).toBe(originalBalance);
});
```

### TC-004: Idempotency – gọi 2 lần cùng reference
```typescript
it('nên trả về cùng kết quả khi gọi với cùng reference', async () => {
  const dto = { ...transferDto, reference: 'same-reference-key' };

  const result1 = await walletService.transfer(dto);
  const result2 = await walletService.transfer(dto);

  expect(result1._id).toEqual(result2._id);
  
  // Balance chỉ thay đổi 1 lần
  const wallet = await walletModel.findById(dto.fromWalletId);
  expect(wallet.balance).toBe(initialBalance - dto.amount);
});
```

### TC-005: Chuyển cho chính mình
```typescript
it('nên throw lỗi khi chuyển tiền cho chính mình', async () => {
  const wallet = await createWallet({ balance: 100000 });
  await expect(
    walletService.transfer({
      fromWalletId: wallet._id,
      toWalletId: wallet._id,
      amount: 50000,
    })
  ).rejects.toThrow('SELF_TRANSFER_NOT_ALLOWED');
});
```

### TC-006: Emit socket sau commit
```typescript
it('nên emit socket event sau khi transaction commit thành công', async () => {
  const emitSpy = jest.spyOn(notificationGateway, 'emitToUser');

  await walletService.transfer(dto);

  expect(emitSpy).toHaveBeenCalledWith(
    expect.any(String),
    'transaction_completed',
    expect.objectContaining({ amount: dto.amount }),
  );
});
```

### TC-007: Không emit socket khi rollback
```typescript
it('KHÔNG nên emit socket khi transaction bị rollback', async () => {
  const emitSpy = jest.spyOn(notificationGateway, 'emitToUser');
  jest.spyOn(walletModel, 'findByIdAndUpdate').mockRejectedValue(new Error());

  await expect(walletService.transfer(dto)).rejects.toThrow();
  expect(emitSpy).not.toHaveBeenCalled();
});
```

## Integration Test: POST /wallets/:id/transfers

```typescript
it('POST /wallets/:id/transfers → 201 khi thành công', async () => {
  const res = await request(app.getHttpServer())
    .post(`/wallets/${fromWalletId}/transfers`)
    .set('Authorization', `Bearer ${accessToken}`)
    .set('X-Idempotency-Key', randomUUID())
    .send({ toWalletId, amount: 50000 });

  expect(res.status).toBe(201);
  expect(res.body.data.status).toBe('COMPLETED');
});

it('POST /wallets/:id/transfers → 401 khi không có token', async () => {
  const res = await request(app.getHttpServer())
    .post(`/wallets/${fromWalletId}/transfers`)
    .send({ toWalletId, amount: 50000 });

  expect(res.status).toBe(401);
});
```
