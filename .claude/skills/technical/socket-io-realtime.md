# ⚡ Kỹ thuật: Socket.IO Realtime

## Kiến trúc

```
[Backend]                    [Frontend]
NestJS Gateway  ←────────→  Socket.IO Client
                 WebSocket
                 
Events:
  transaction_completed  →  Cập nhật balance + hiển thị toast
  balance_updated        →  Refresh số dư
  notification_received  →  Hiển thị notification bell
```

## Quy tắc Quan trọng

> **KHÔNG BAO GIỜ** emit socket event trước khi transaction commit.
> Emit phải xảy ra SAU khi `commitTransaction()` thành công.

## Backend – NestJS Gateway

```typescript
// gateways/notification.gateway.ts
@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL,
    credentials: true,
  },
  namespace: '/notifications',
})
@Injectable()
export class NotificationGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  private readonly server: Server;
  
  private readonly logger = new Logger(NotificationGateway.name);
  
  // Map: userId → Set<socketId>
  private readonly userSockets = new Map<string, Set<string>>();

  async handleConnection(client: Socket) {
    try {
      // Verify JWT từ handshake
      const token = client.handshake.auth.token;
      const payload = this.jwtService.verify(token, {
        secret: process.env.JWT_ACCESS_SECRET,
      });
      
      // Lưu mapping userId → socketId
      const userId = payload.sub;
      if (!this.userSockets.has(userId)) {
        this.userSockets.set(userId, new Set());
      }
      this.userSockets.get(userId).add(client.id);
      
      // Gán userId vào socket data
      client.data.userId = userId;
      
      this.logger.log(`Client connected: ${client.id}, userId: ${userId}`);
    } catch {
      this.logger.warn(`Unauthorized socket connection: ${client.id}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const userId = client.data.userId;
    if (userId) {
      this.userSockets.get(userId)?.delete(client.id);
      if (this.userSockets.get(userId)?.size === 0) {
        this.userSockets.delete(userId);
      }
    }
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  // Gửi event đến một user cụ thể (tất cả tab/device của họ)
  emitToUser(userId: string, event: string, data: any) {
    const socketIds = this.userSockets.get(userId);
    if (!socketIds) return;
    
    for (const socketId of socketIds) {
      this.server.to(socketId).emit(event, data);
    }
  }
}
```

## Emit SAU KHI Commit (Pattern đúng)

```typescript
// wallets.service.ts
async transfer(dto: TransferDto): Promise<TransactionDocument> {
  const session = await this.connection.startSession();
  session.startTransaction();
  let transaction: TransactionDocument;
  
  try {
    // ... logic chuyển tiền ...
    
    [transaction] = await this.transactionModel.create([{...}], { session });
    
    // COMMIT trước
    await session.commitTransaction();
    
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    await session.endSession();
  }
  
  // Emit SAU KHI session đã kết thúc (commit thành công)
  // Lỗi emit socket KHÔNG ảnh hưởng đến transaction
  try {
    this.notificationGateway.emitToUser(dto.fromUserId, 'transaction_completed', {
      transactionId: transaction._id,
      type: 'DEBIT',
      amount: dto.amount,
      newBalance: transaction.fromWalletNewBalance,
    });
    
    this.notificationGateway.emitToUser(dto.toUserId, 'transaction_completed', {
      transactionId: transaction._id,
      type: 'CREDIT',
      amount: dto.amount,
      newBalance: transaction.toWalletNewBalance,
    });
  } catch (socketError) {
    // Log nhưng KHÔNG throw – socket error không rollback transaction
    this.logger.warn('Socket emit failed:', socketError);
  }
  
  return transaction;
}
```

## Frontend – Socket.IO Client

```typescript
// hooks/useSocket.ts
import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { updateBalance } from '@/features/wallet/walletSlice';

export function useSocket() {
  const socketRef = useRef<Socket | null>(null);
  const accessToken = useAppSelector((state) => state.auth.accessToken);
  const dispatch = useAppDispatch();
  
  useEffect(() => {
    if (!accessToken) return;
    
    socketRef.current = io(`${import.meta.env.VITE_API_URL}/notifications`, {
      auth: { token: accessToken },
      transports: ['websocket'],
    });
    
    const socket = socketRef.current;
    
    socket.on('connect', () => {
      console.log('Socket connected');
    });
    
    socket.on('transaction_completed', (data) => {
      // Cập nhật balance trong Redux store
      dispatch(updateBalance({ newBalance: data.newBalance }));
      
      // Hiển thị toast thông báo
      const type = data.type === 'CREDIT' ? 'Nhận tiền' : 'Chuyển tiền';
      toast.success(`${type}: ${formatVND(data.amount)}`);
    });
    
    socket.on('disconnect', () => {
      console.log('Socket disconnected');
    });
    
    return () => {
      socket.disconnect();
    };
  }, [accessToken]);
  
  return { socket: socketRef.current };
}
```

## Multi-instance Scale (Redis Adapter)

Khi chạy nhiều instance backend, dùng Redis adapter để socket events được broadcast đúng:

```typescript
// main.ts
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';

const pubClient = createClient({ url: process.env.REDIS_URL });
const subClient = pubClient.duplicate();

await Promise.all([pubClient.connect(), subClient.connect()]);
io.adapter(createAdapter(pubClient, subClient));
```
