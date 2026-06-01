# 💳 Frontend Flow: Nạp tiền

## Màn hình: `/topup`

## Luồng

```
Step 1: Chọn phương thức
  → Ngân hàng / Ví điện tử (VNPay, MoMo, v.v.)
  → Nhập số tiền

Step 2: Redirect cổng thanh toán
  → Mở popup/redirect đến trang payment gateway
  → Sau khi thanh toán → redirect về /topup/result

Step 3: Kết quả
  → Polling API hoặc chờ socket event
  → Success: "Nạp tiền thành công"
  → Failure: "Nạp tiền thất bại"
```

## API

```typescript
// POST /api/v1/wallets/me/topup/initiate
// Body: { amount, method, redirectUrl }
// Response: { paymentUrl } – URL để redirect đến gateway

// GET /api/v1/transactions/:id
// Polling kết quả (mỗi 3 giây, tối đa 60 giây)
```

## Trạng thái Chờ

```typescript
// Sau khi redirect về từ gateway
const [status, setStatus] = useState<'pending' | 'success' | 'failed'>('pending');

// Socket lắng nghe
socket.on('transaction_completed', (data) => {
  if (data.transactionId === txId) {
    setStatus(data.type === 'CREDIT' ? 'success' : 'failed');
  }
});

// Fallback: polling nếu socket không có
useInterval(() => {
  refetchTransaction();
}, status === 'pending' ? 3000 : null);
```

## Số tiền Nhanh

Hiển thị các nút chọn nhanh: 50K, 100K, 200K, 500K, 1M, 2M
