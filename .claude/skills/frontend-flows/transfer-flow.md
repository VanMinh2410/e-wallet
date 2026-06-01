# 💸 Frontend Flow: Chuyển khoản

## Màn hình: `/transfer`

## Luồng Người dùng (Multi-step Form)

```
Step 1: Tìm người nhận
  → Nhập số điện thoại hoặc email
  → Tìm kiếm real-time (debounce 500ms)
  → Hiển thị tên + avatar người nhận
  → Nhấn "Tiếp tục"

Step 2: Nhập số tiền
  → Nhập số tiền (format VND tự động)
  → Nhập ghi chú (tùy chọn)
  → Hiển thị số dư hiện tại
  → Validate: 1.000đ ≤ amount ≤ số dư
  → Nhấn "Xem lại"

Step 3: Xác nhận
  → Hiển thị: người nhận, số tiền, ghi chú, phí (nếu có)
  → Nhấn "Xác nhận chuyển"
  → Loading...

Step 4: Kết quả
  → Success: animation confetti + "Chuyển khoản thành công"
  → Failure: thông báo lỗi rõ ràng + nút thử lại
```

## State

```typescript
interface TransferState {
  step: 1 | 2 | 3 | 4;
  recipient: UserInfo | null;
  amount: number;
  description: string;
  isLoading: boolean;
  error: string | null;
  result: TransactionResult | null;
}
```

## API Calls

```typescript
// Step 1: Tìm người nhận
// GET /api/v1/users/search?q=0901234567
const useSearchUser = (query: string) => {
  return useQuery({
    queryKey: ['user-search', query],
    queryFn: () => api.get(`/users/search?q=${query}`).then(r => r.data.data),
    enabled: query.length >= 9,
    staleTime: 30_000,
  });
};

// Step 3: Thực hiện chuyển khoản
// POST /api/v1/wallets/:fromWalletId/transfers
const useTransfer = () => {
  return useMutation({
    mutationFn: async (dto: TransferRequest) => {
      return api.post(`/wallets/${walletId}/transfers`, dto, {
        headers: { 'X-Idempotency-Key': crypto.randomUUID() },
      });
    },
    onSuccess: (data) => {
      setStep(4);
      setResult(data.data.data);
      // Cập nhật balance ngay (không cần chờ socket)
      dispatch(decreaseBalance(amount));
      // Invalidate transaction history cache
      queryClient.invalidateQueries(['transactions']);
    },
    onError: (error) => {
      setStep(4);
      setError(parseErrorMessage(error));
    },
  });
};
```

## Xử lý Realtime (Socket)

```typescript
// Khi nhận event transaction_completed từ socket
// → Balance đã được cập nhật qua Redux
// → Hiển thị toast nếu người dùng không ở trang transfer
```

## Validation

```typescript
const transferSchema = z.object({
  amount: z.number()
    .min(1000, 'Số tiền tối thiểu là 1.000đ')
    .max(100_000_000, 'Số tiền tối đa là 100.000.000đ'),
  description: z.string().max(200, 'Ghi chú tối đa 200 ký tự').optional(),
});
```

## Xử lý Edge Cases

| Tình huống | Xử lý |
|---|---|
| Số dư không đủ | Hiển thị ngay khi nhập số tiền |
| Chuyển cho chính mình | Validate và báo lỗi |
| Network timeout | Retry 1 lần, hiển thị lỗi nếu vẫn fail |
| Người nhận không tồn tại | Thông báo ngay ở step 1 |
| Token hết hạn | Silent refresh tự động |
