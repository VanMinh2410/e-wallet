# 📜 Frontend Flow: Lịch sử Giao dịch

## Màn hình: `/transactions`

## Layout

```
┌──────────────────────────────┐
│  Lịch sử Giao dịch           │
│  [Bộ lọc] [Tìm kiếm]        │
├──────────────────────────────┤
│  Tháng 1/2025                │
│  ─────────────────────────── │
│  ➡️ Chuyển cho Trần B  -50K  │
│  ⬇️ Nạp từ VNPay    +500K   │
│  ⬅️ Nhận từ Nguyễn A +100K  │
│  ─────────────────────────── │
│  Tháng 12/2024               │
│  ...                         │
│  [Tải thêm...]               │
└──────────────────────────────┘
```

## Data Fetching với Infinite Scroll

```typescript
const useTransactionHistory = (filters: TransactionFilters) => {
  return useInfiniteQuery({
    queryKey: ['transactions', filters],
    queryFn: ({ pageParam = 1 }) =>
      api.get('/transactions', {
        params: { page: pageParam, limit: 15, ...filters },
      }).then(r => r.data.data),
    getNextPageParam: (lastPage) => {
      const { page, totalPages } = lastPage.meta;
      return page < totalPages ? page + 1 : undefined;
    },
    staleTime: 30_000,
  });
};
```

## Bộ lọc

```typescript
interface TransactionFilters {
  type?: 'ALL' | 'TRANSFER' | 'TOPUP' | 'WITHDRAW';
  startDate?: string;
  endDate?: string;
  minAmount?: number;
  maxAmount?: number;
}
```

## Hiển thị Giao dịch

```typescript
// Màu: xanh lá cho CREDIT (nhận tiền), đỏ cho DEBIT (gửi tiền)
const getTransactionColor = (type: 'CREDIT' | 'DEBIT') =>
  type === 'CREDIT' ? 'text-green-600' : 'text-red-500';

// Icon
const getTransactionIcon = (txType: string) => {
  switch (txType) {
    case 'TRANSFER_OUT': return '➡️';
    case 'TRANSFER_IN': return '⬅️';
    case 'TOPUP': return '⬇️';
    case 'WITHDRAW': return '⬆️';
  }
};
```

## Realtime Update

Khi có transaction mới (socket event) → prepend vào đầu danh sách
