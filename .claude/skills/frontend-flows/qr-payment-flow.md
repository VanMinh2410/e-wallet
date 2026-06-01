# 📱 Frontend Flow: QR Payment

## Màn hình: `/qr-payment`

## 2 Chế độ

### Chế độ 1: Hiển thị QR của mình (nhận tiền)
```
→ Generate QR code chứa walletId + userId
→ Người khác quét → tự động điền thông tin người nhận
→ Chia sẻ QR qua screenshot/share
```

### Chế độ 2: Quét QR để thanh toán (gửi tiền)
```
→ Mở camera (quyền camera)
→ Quét QR code của người nhận
→ Parse QR → lấy walletId
→ Chuyển sang TransferFlow với recipient đã điền sẵn
```

## API

```typescript
// Lấy QR code của mình
// GET /api/v1/wallets/me/qr-code
// Response: { qrData: string, qrImageUrl: string }

// Xác thực QR code khi quét
// POST /api/v1/wallets/verify-qr
// Body: { qrData }
// Response: { walletId, userId, ownerName }
```

## QR Code Format

```json
{
  "v": 1,
  "walletId": "wallet_abc123",
  "userId": "user_xyz",
  "name": "Nguyễn Văn A",
  "checksum": "hmac_sha256_signature"
}
```

## Thư viện

```typescript
// Hiển thị QR: react-qr-code
import QRCode from 'react-qr-code';

// Scan QR: @zxing/library hoặc react-qr-reader
import { BrowserQRCodeReader } from '@zxing/library';
```

## Xử lý Camera Permission

```typescript
const requestCameraPermission = async () => {
  try {
    await navigator.mediaDevices.getUserMedia({ video: true });
    setHasPermission(true);
  } catch {
    setError('Vui lòng cho phép truy cập camera');
  }
};
```
