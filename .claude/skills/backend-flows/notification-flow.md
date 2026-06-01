# 🔔 Backend Flow: Notification

## Kiến trúc Thông báo

```
[Event] → [BullMQ notification queue] → [Worker] → [Socket.IO + Push + Email/SMS]
```

## Notification Queue Job

```typescript
// queue/notification.processor.ts
@Processor('notification')
export class NotificationProcessor extends WorkerHost {
  async process(job: Job<NotificationJobData>) {
    const { userId, type, data } = job.data;
    
    switch (type) {
      case 'TRANSACTION_COMPLETED':
        await this.sendTransactionNotification(userId, data);
        break;
      case 'TOPUP_SUCCESS':
        await this.sendTopupNotification(userId, data);
        break;
      case 'WITHDRAW_STATUS':
        await this.sendWithdrawNotification(userId, data);
        break;
    }
  }

  private async sendTransactionNotification(userId: string, data: any) {
    // 1. Lưu notification vào DB
    await this.notificationModel.create({
      userId,
      type: 'TRANSACTION',
      title: data.type === 'CREDIT' ? 'Nhận tiền thành công' : 'Chuyển tiền thành công',
      message: `${data.type === 'CREDIT' ? '+' : '-'}${formatVND(data.amount)}`,
      data,
      isRead: false,
    });
    
    // 2. Emit socket (realtime)
    this.gateway.emitToUser(userId, 'notification_received', {
      type: 'TRANSACTION',
      message: data.message,
    });
    
    // 3. Push notification (nếu user bật)
    // await this.pushService.send(userId, notification);
  }
}
```

## Notification Schema

```typescript
@Schema({ timestamps: true })
export class Notification {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  message: string;

  @Prop({ default: false })
  isRead: boolean;

  @Prop({ type: Object })
  data: Record<string, any>;
}
```

## Endpoints

```
GET  /api/v1/notifications          # Danh sách thông báo
GET  /api/v1/notifications/unread-count
PATCH /api/v1/notifications/:id/read
PATCH /api/v1/notifications/read-all
```
