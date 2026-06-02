import { WebSocketGateway, WebSocketServer, OnGatewayConnection } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://localhost:5176',
].filter(Boolean) as string[];

@WebSocketGateway({
  cors: { origin: allowedOrigins, credentials: true },
  namespace: '/notifications',
})
export class NotificationGateway implements OnGatewayConnection {
  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    const userId = client.handshake.auth?.userId as string | undefined;
    if (userId) client.join(`user:${userId}`);

    const role = client.handshake.auth?.role as string | undefined;
    if (role === 'admin') {
      client.join('admin');
    }
  }

  emitBalanceUpdated(userId: string, balance: number) {
    this.server?.to(`user:${userId}`).emit('balance_updated', { balance });
  }

  emitTransactionCompleted(userId: string, data: Record<string, unknown>) {
    this.server?.to(`user:${userId}`).emit('transaction_completed', data);
    this.server?.to('admin').emit('transaction_completed', data);
  }

  emitNotification(userId: string, notification: Record<string, unknown>) {
    this.server?.to(`user:${userId}`).emit('notification_received', notification);
  }
}
