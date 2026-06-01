import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { getAccessToken } from '../services/api';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';

export function useSocket(userId: string | undefined, handlers: {
  onBalanceUpdated?: (balance: number) => void;
  onTransactionCompleted?: (data: unknown) => void;
  onNotification?: (data: unknown) => void;
}) {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!userId) return;
    const socket = io(`${SOCKET_URL}/notifications`, {
      auth: { userId },
      transports: ['websocket'],
    });
    socketRef.current = socket;

    socket.on('balance_updated', (p: { balance: number }) => handlers.onBalanceUpdated?.(p.balance));
    socket.on('transaction_completed', (p) => handlers.onTransactionCompleted?.(p));
    socket.on('notification_received', (p) => handlers.onNotification?.(p));

    return () => {
      socket.disconnect();
    };
  }, [userId, getAccessToken()]);

  return socketRef;
}
