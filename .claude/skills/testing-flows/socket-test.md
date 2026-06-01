# ⚡ Testing Flow: Socket.IO Test

## Test Suite: NotificationGateway

### TC-S001: Kết nối với token hợp lệ
```typescript
it('nên kết nối thành công khi có access token hợp lệ', (done) => {
  const client = io(`http://localhost:${port}/notifications`, {
    auth: { token: validAccessToken },
  });
  
  client.on('connect', () => {
    expect(client.connected).toBe(true);
    client.disconnect();
    done();
  });
  
  client.on('connect_error', (err) => {
    done.fail(err.message);
  });
});
```

### TC-S002: Từ chối kết nối không có token
```typescript
it('nên ngắt kết nối khi không có token', (done) => {
  const client = io(`http://localhost:${port}/notifications`, {
    auth: { token: '' },
  });
  
  client.on('disconnect', () => {
    done();
  });
  
  // Timeout nếu không bị disconnect
  setTimeout(() => done.fail('Should have been disconnected'), 3000);
});
```

### TC-S003: Nhận event transaction_completed
```typescript
it('nên nhận event sau khi transfer thành công', (done) => {
  const senderClient = io(`http://localhost:${port}/notifications`, {
    auth: { token: senderToken },
  });
  
  senderClient.on('transaction_completed', (data) => {
    expect(data.type).toBe('DEBIT');
    expect(data.amount).toBe(50000);
    senderClient.disconnect();
    done();
  });
  
  // Sau khi connected, thực hiện transfer
  senderClient.on('connect', async () => {
    await walletService.transfer({
      fromWalletId: senderWalletId,
      toWalletId: receiverWalletId,
      amount: 50000,
    });
  });
});
```

### TC-S004: Không emit khi transaction thất bại
```typescript
it('KHÔNG nên emit event khi transfer thất bại', (done) => {
  const client = io(`http://localhost:${port}/notifications`, {
    auth: { token: senderToken },
  });
  
  let eventReceived = false;
  client.on('transaction_completed', () => {
    eventReceived = true;
  });
  
  client.on('connect', async () => {
    try {
      await walletService.transfer({
        fromWalletId: emptyWalletId,
        toWalletId: receiverWalletId,
        amount: 999999999, // Sẽ fail vì số dư không đủ
      });
    } catch {}
    
    setTimeout(() => {
      expect(eventReceived).toBe(false);
      client.disconnect();
      done();
    }, 500);
  });
});
```

### TC-S005: Multi-device – nhận event trên tất cả tab
```typescript
it('nên gửi event đến tất cả socket của cùng user', (done) => {
  const client1 = io(url, { auth: { token } });
  const client2 = io(url, { auth: { token } }); // Tab thứ 2

  let received = 0;
  const checkDone = () => {
    received++;
    if (received === 2) {
      client1.disconnect();
      client2.disconnect();
      done();
    }
  };

  client1.on('transaction_completed', checkDone);
  client2.on('transaction_completed', checkDone);
  
  client1.on('connect', () => {
    client2.on('connect', () => {
      walletService.transfer(dto);
    });
  });
});
```
