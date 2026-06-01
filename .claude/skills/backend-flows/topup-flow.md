# ⬇️ Backend Flow: Nạp tiền

## Endpoint

```
POST /api/v1/wallets/me/topup/initiate
Authorization: Bearer <token>
```

## DTO

```typescript
export class InitiateTopupDto {
  @IsNumber()
  @Min(10000, { message: 'Nạp tối thiểu 10.000đ' })
  @Max(50_000_000)
  amount: number;

  @IsEnum(['VNPAY', 'MOMO', 'BANK_TRANSFER'])
  method: string;

  @IsUrl()
  redirectUrl: string; // URL để redirect sau khi thanh toán
}
```

## Luồng Nạp tiền (Async)

```
1. Client gọi POST /topup/initiate
2. Server:
   a. Tạo Transaction record (status: PENDING)
   b. Gọi Payment Gateway API → nhận paymentUrl
   c. Return paymentUrl cho client
3. Client redirect đến paymentUrl
4. Người dùng thanh toán trên gateway
5. Gateway gọi webhook: POST /webhooks/topup
6. Server xử lý webhook:
   a. Verify HMAC signature
   b. Idempotency check
   c. Đẩy vào BullMQ queue
   d. Return 200 OK
7. BullMQ worker xử lý:
   a. Verify payment với gateway API
   b. MongoDB Transaction: tăng balance + update tx status
   c. Emit socket event
   d. Send notification
```

## Webhook Handler

```typescript
@Post('topup')
@HttpCode(200)
async handleTopupWebhook(
  @Headers('x-gateway-signature') sig: string,
  @Body() payload: TopupWebhookPayload,
  @RawBody() rawBody: Buffer,
) {
  if (!this.webhookService.verify(rawBody, sig)) {
    return { received: true }; // Vẫn 200, không 401
  }
  
  await this.topupQueue.add('process', payload, {
    jobId: payload.reference, // Idempotency
  });
  
  return { received: true };
}
```

## Error Handling

- Gateway timeout → retry webhook (gateway tự retry)
- Payment verification fail → transaction FAILED, thông báo user
- Queue full → accept webhook, xử lý sau (không mất data)
