import { useEffect, useRef, useState } from 'react';
import { connectSocket } from '@/services/socket';

export type RealtimeState = 'connecting' | 'connected' | 'disconnected';

interface ServerInfoEvent {
  service: string;
  timestamp: string;
}

interface PongEvent {
  sentAt: number;
  serverAt: number;
}

const PING_INTERVAL_MS = 3000;

/**
 * Tracks the Socket.IO connection state and round-trip latency in real time.
 */
export function useRealtimeStatus() {
  const [state, setState] = useState<RealtimeState>('connecting');
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [serverInfo, setServerInfo] = useState<ServerInfoEvent | null>(null);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    const socket = connectSocket();

    const onConnect = () => setState('connected');
    const onDisconnect = () => {
      setState('disconnected');
      setLatencyMs(null);
    };
    const onServerInfo = (info: ServerInfoEvent) => setServerInfo(info);
    const onPong = (payload: PongEvent) => {
      const roundTrip = Date.now() - payload.sentAt;
      setLatencyMs(Math.max(0, Math.round(roundTrip / 2)));
    };
    const measure = () => {
      if (socket.connected) {
        socket.emit('ping', Date.now());
      }
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('server:info', onServerInfo);
    socket.on('pong', onPong);

    measure();
    timerRef.current = window.setInterval(measure, PING_INTERVAL_MS);

    return () => {
      if (timerRef.current !== null) {
        window.clearInterval(timerRef.current);
      }
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('server:info', onServerInfo);
      socket.off('pong', onPong);
    };
  }, []);

  return { state, latencyMs, serverInfo };
}