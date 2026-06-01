# 📱 Backend Flow: QR Payment

## Endpoints

```
GET  /api/v1/wallets/me/qr-code    # Lấy QR của mình
POST /api/v1/wallets/verify-qr     # Verify QR khi scan
POST /api/v1/wallets/qr-pay        # Thanh toán sau khi scan
```

## Tạo QR Code

```typescript
// GET /wallets/me/qr-code
async generateQrCode(userId: string) {
  const wallet = await this.walletModel.findOne({ userId }).lean();
  
  const qrPayload = {
    v: 1,                    // version
    walletId: wallet._id.toString(),
    userId: userId,
    name: wallet.ownerName,
  };
  
  // Tạo checksum để chống giả mạo
  const checksum = crypto
    .createHmac('sha256', process.env.QR_SECRET)
    .update(JSON.stringify(qrPayload))
    .digest('hex')
    .substring(0, 16);
  
  const qrData = JSON.stringify({ ...qrPayload, checksum });
  
  return {
    qrData,
    // qrImageUrl: generate QR image URL (optional)
  };
}
```

## Verify QR Code

```typescript
// POST /wallets/verify-qr
// Body: { qrData: string }
async verifyQrCode(qrData: string) {
  const parsed = JSON.parse(qrData);
  
  // Verify checksum
  const { checksum, ...payload } = parsed;
  const expectedChecksum = crypto
    .createHmac('sha256', process.env.QR_SECRET)
    .update(JSON.stringify(payload))
    .digest('hex')
    .substring(0, 16);
  
  if (checksum !== expectedChecksum) {
    throw new BadRequestException('QR code không hợp lệ');
  }
  
  // Tìm user
  const user = await this.usersService.findById(payload.userId);
  return {
    walletId: payload.walletId,
    userId: payload.userId,
    ownerName: user.fullName,
  };
}
```

## Sau khi Verify

Gọi transfer flow như bình thường với toWalletId từ QR payload.
