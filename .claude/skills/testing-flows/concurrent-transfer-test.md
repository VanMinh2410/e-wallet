# ⚡ Testing Flow: Concurrent Transfer Test

## Mục đích
Kiểm tra hệ thống xử lý đúng khi nhiều giao dịch xảy ra đồng thời (race condition).

## TC-C001: 2 giao dịch đồng thời từ cùng ví
```typescript
it('nên đảm bảo tổng tiền không thay đổi khi 2 transfer đồng thời', async () => {
  const sender = await createWallet({ balance: 100000 });
  const receiver1 = await createWallet({ balance: 0 });
  const receiver2 = await createWallet({ balance: 0 });

  // Gửi 2 request đồng thời
  const [result1, result2] = await Promise.allSettled([
    walletService.transfer({
      fromWalletId: sender._id,
      toWalletId: receiver1._id,
      amount: 70000,
    }),
    walletService.transfer({
      fromWalletId: sender._id,
      toWalletId: receiver2._id,
      amount: 70000, // Tổng > balance → 1 cái phải fail
    }),
  ]);

  // Đúng 1 thành công, 1 thất bại
  const successes = [result1, result2].filter(r => r.status === 'fulfilled');
  const failures = [result1, result2].filter(r => r.status === 'rejected');
  expect(successes).toHaveLength(1);
  expect(failures).toHaveLength(1);

  // Kiểm tra tổng tiền không đổi
  const senderAfter = await walletModel.findById(sender._id);
  const r1After = await walletModel.findById(receiver1._id);
  const r2After = await walletModel.findById(receiver2._id);

  const totalBalance = senderAfter.balance + r1After.balance + r2After.balance;
  expect(totalBalance).toBe(100000); // Tổng tiền bảo toàn
});
```

## TC-C002: 100 transfers đồng thời – Load Test với k6

```javascript
// .claude/scripts/load-test-transfer.js
import http from 'k6/http';
import { check } from 'k6';

export const options = {
  vus: 50,           // 50 virtual users
  duration: '30s',   // trong 30 giây
};

export default function () {
  const res = http.post(
    `${__ENV.API_URL}/wallets/sender-wallet-id/transfers`,
    JSON.stringify({
      toWalletId: 'receiver-wallet-id',
      amount: 1000,
      reference: `ref-${Date.now()}-${__VU}-${__ITER}`,
    }),
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${__ENV.ACCESS_TOKEN}`,
      },
    }
  );

  check(res, {
    'status is 201 or 400 (insufficient)': (r) =>
      r.status === 201 || r.status === 400,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });
}
```

## TC-C003: Kiểm tra Database Consistency sau Concurrent Test

```typescript
it('tổng balance của tất cả ví phải bằng nhau trước và sau', async () => {
  // Tính tổng trước
  const walletsBefore = await walletModel.find({}).lean();
  const totalBefore = walletsBefore.reduce((s, w) => s + w.balance, 0);

  // Chạy 20 transfer đồng thời
  await Promise.allSettled(
    Array.from({ length: 20 }, (_, i) =>
      walletService.transfer({
        fromWalletId: wallets[i % wallets.length]._id,
        toWalletId: wallets[(i + 1) % wallets.length]._id,
        amount: 1000,
        reference: `concurrent-${i}`,
      })
    )
  );

  // Tính tổng sau
  const walletsAfter = await walletModel.find({}).lean();
  const totalAfter = walletsAfter.reduce((s, w) => s + w.balance, 0);

  // Tổng phải không đổi
  expect(totalAfter).toBe(totalBefore);
});
```

## Assertion Quan trọng

1. **Tổng tiền bảo toàn**: Tổng balance của tất cả ví = constant
2. **Không có balance âm**: Không ví nào có balance < 0
3. **Số lượng transactions đúng**: N request thành công → N transactions
4. **Không duplicate**: Cùng reference → chỉ 1 transaction
