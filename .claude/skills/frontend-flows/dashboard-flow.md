# 🏠 Frontend Flow: Dashboard

## Màn hình: `/dashboard`

## Layout

```
┌─────────────────────────────┐
│  Header: Avatar + Tên + 🔔  │
├─────────────────────────────┤
│  Balance Card               │
│  ┌───────────────────────┐  │
│  │ Số dư của bạn         │  │
│  │ ₫ 2.500.000     👁    │  │
│  └───────────────────────┘  │
├─────────────────────────────┤
│  Quick Actions              │
│  [Nạp] [Chuyển] [Rút] [QR] │
├─────────────────────────────┤
│  Giao dịch gần đây          │
│  - Nhận từ Nguyễn Văn A    │
│  - Chuyển cho Trần B        │
│  - Nạp từ VNPay             │
│  [Xem tất cả →]             │
└─────────────────────────────┘
```

## Data Fetching

```typescript
// hooks/useDashboard.ts
export function useDashboard() {
  const walletQuery = useQuery({
    queryKey: ['wallet', 'balance'],
    queryFn: () => api.get('/wallets/me').then(r => r.data.data),
    staleTime: 60_000, // 1 phút
    refetchOnWindowFocus: true,
  });

  const recentTransactionsQuery = useQuery({
    queryKey: ['transactions', 'recent'],
    queryFn: () => api.get('/transactions?page=1&limit=5').then(r => r.data.data),
    staleTime: 30_000,
  });

  return { wallet: walletQuery, transactions: recentTransactionsQuery };
}
```

## Realtime Balance Update

```typescript
// Dashboard kết nối socket và lắng nghe cập nhật balance
useEffect(() => {
  socket.on('balance_updated', (data) => {
    // Cập nhật balance trong store
    dispatch(setBalance(data.newBalance));
    // Refresh recent transactions
    queryClient.invalidateQueries(['transactions', 'recent']);
  });
}, [socket]);
```

## Balance Card Features

- Ẩn/hiện số dư (toggle với icon 👁)
- Format: `2.500.000 ₫`
- Loading skeleton khi đang fetch
- Màu xanh lá cho số dư dương

## Quick Actions

| Button | Route | Icon |
|---|---|---|
| Nạp tiền | /topup | ⬇️ |
| Chuyển khoản | /transfer | ➡️ |
| Rút tiền | /withdraw | ⬆️ |
| QR Payment | /qr-payment | 📱 |

## Trạng thái Loading

- Balance card: skeleton (3 dòng)
- Quick actions: hiển thị ngay (không cần data)
- Transaction list: skeleton list (5 items)

## Notification Bell
- Số thông báo chưa đọc hiển thị badge
- Click → dropdown danh sách thông báo
- Realtime update khi có thông báo mới
