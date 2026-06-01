import { WebSocketGateway, WebSocketServer, OnGatewayConnection } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: { origin: process.env.FRONTEND_URL || 'http://localhost:5173', credentials: true },
  namespace: '/notifications',
})
export class NotificationGateway implements OnGatewayConnection {
  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    const userId = client.handshake.auth?.userId as string | undefined;
    if (userId) client.join(`user:${userId}`);
  }

  emitBalanceUpdated(userId: string, balance: number) {
    this.server?.to(`user:${userId}`).emit('balance_updated', { balance });
  }

  emitTransactionCompleted(userId: string, data: Record<string, unknown>) {
    this.server?.to(`user:${userId}`).emit('transaction_completed', data);
  }

  emitNotification(userId: string, notification: Record<string, unknown>) {
    this.server?.to(`user:${userId}`).emit('notification_received', notification);
  }
}
