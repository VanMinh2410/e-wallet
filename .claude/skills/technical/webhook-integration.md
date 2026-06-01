# 🔗 Kỹ thuật: Webhook Integration

## Tổng quan
Webhook được dùng khi cổng thanh toán (payment gateway) thông báo kết quả giao dịch nạp/rút tiền cho server HKi Wallet.

## Luồng Webhook

```
[Payment Gateway] → POST /webhooks/topup
                         ↓
                   1. Verify signature
                   2. Check idempotency
                   3. Đẩy vào BullMQ queue
                   4. Trả về 200 ngay (không xử lý sync)
                         ↓
                   [BullMQ Worker] xử lý async
```

## Implementation

```typescript
// webhooks.controller.ts
@Controller('webhooks')
export class WebhooksController {
  @Post('topup')
  @HttpCode(200) // Luôn trả 200 để gateway không retry
  async handleTopupWebhook(
    @Headers('X-Gateway-Signature') signature: string,
    @Body() payload: WebhookPayload,
    @RawBody() rawBody: Buffer, // Cần raw body để verify HMAC
  ) {
    // 1. Verify HMAC signature
    const isValid = this.webhookService.verifySignature(rawBody, signature);
    if (!isValid) {
      this.logger.warn('Invalid webhook signature');
      return { received: true }; // Trả 200 nhưng không xử lý
    }

    // 2. Idempotency check
    const idemKey = `webhook:${payload.reference}`;
    const alreadyProcessed = await this.redis.exists(idemKey);
    if (alreadyProcessed) {
      return { received: true }; // Đã xử lý rồi
    }

    // 3. Mark as received (trước khi đẩy queue)
    await this.redis.setex(idemKey, 24 * 60 * 60, '1');

    // 4. Đẩy vào queue để xử lý async
    await this.topupQueue.add('webhook-topup', payload);

    return { received: true };
  }
}
```

## Verify HMAC Signature

```typescript
// webhooks.service.ts
verifySignature(rawBody: Buffer, signature: string): boolean {
  const expectedSig = crypto
    .createHmac('sha256', process.env.WEBHOOK_SECRET)
    .update(rawBody)
    .digest('hex');
  
  // So sánh timing-safe (chống timing attack)
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSig),
  );
}
```

## Retry Policy

Nếu webhook bị miss (server down), gateway sẽ retry. Cần đảm bảo idempotency:
- Lần 1: nhận → xử lý → OK
- Lần 2 (retry): nhận → check idempotency → bỏ qua → trả 200
