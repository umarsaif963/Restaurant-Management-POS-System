import { io, type Socket } from 'socket.io-client';
import { env } from '@/config/env';

let socket: Socket | null = null;

/**
 * Lazily initializes a single Socket.IO connection.
 * Uses the Vite dev proxy (/socket.io) or the explicitly configured URL.
 */
export function connectSocket(): Socket {
  if (socket) {
    return socket;
  }
  const url = env.VITE_SOCKET_URL || undefined;
  socket = io(url, {
    path: '/socket.io',
    withCredentials: true,
    transports: ['websocket', 'polling'],
  });
  return socket;
}

export function getSocket(): Socket | null {
  return socket;
}

export function disconnectSocket(): void {
  socket?.disconnect();
  socket = null;
}