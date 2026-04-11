"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { io, Socket } from "socket.io-client";

// Module-level socket singleton — shared across all hook instances
let socketInstance: Socket | null = null;

const EMPTY_ARRAY = Object.freeze([] as any[]);

function getSocket(): Socket {
  if (!socketInstance) {
    socketInstance = io({
      path: '/socket.io',
      // Cloudflare Tunnel compatibility:
      // Start with polling (always works), then upgrade to WebSocket if available
      transports: ['polling', 'websocket'],
      upgrade: true,
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 2000,
      reconnectionDelayMax: 10000,
      timeout: 20000,
    });
  }
  return socketInstance;
}

type SnapshotData = {
  doctors: any[];
  shifts: any[];
  leaves: any[];
  settings: any;
} | null;

export const useSocket = (room?: string) => {
  const [isConnected, setIsConnected] = useState(false);
  const [data, setData] = useState<SnapshotData>(null);
  const [lastUpdate, setLastUpdate] = useState<number>(0);
  const roomRef = useRef(room);
  roomRef.current = room;

  useEffect(() => {
    const sock = getSocket();

    const onConnect = () => {
      console.log('[Socket.IO] Connected:', sock.id);
      setIsConnected(true);
      // Request fresh data on every (re)connection
      sock.emit('request_admin_sync');
      if (roomRef.current) sock.emit('join_room', roomRef.current);
    };

    const onDisconnect = (reason: string) => {
      console.log('[Socket.IO] Disconnected:', reason);
      setIsConnected(false);
    };

    const onSync = (payload: SnapshotData) => {
      if (!payload) return;
      console.log(
        `[Socket.IO] Sync received — doctors: ${payload.doctors?.length ?? 0}, shifts: ${payload.shifts?.length ?? 0}`
      );
      setData(payload);
      setLastUpdate(Date.now());
    };

    const onConnectError = (err: Error) => {
      console.error('[Socket.IO] Connect error:', err.message);
    };

    sock.on('connect', onConnect);
    sock.on('disconnect', onDisconnect);
    sock.on('admin_sync_all', onSync);
    sock.on('connect_error', onConnectError);

    // Start connection if not yet connected
    if (!sock.connected) {
      sock.connect();
    } else {
      // Already connected — immediately request fresh data
      setIsConnected(true);
      sock.emit('request_admin_sync');
      if (roomRef.current) sock.emit('join_room', roomRef.current);
    }

    return () => {
      sock.off('connect', onConnect);
      sock.off('disconnect', onDisconnect);
      sock.off('admin_sync_all', onSync);
      sock.off('connect_error', onConnectError);
    };
  }, []); // Only run once on mount

  const refresh = () => {
    const sock = socketInstance;
    if (sock?.connected) {
      console.log('[Socket.IO] Manual refresh requested');
      sock.emit('request_admin_sync');
    }
  };

  return useMemo(() => ({
    socket: socketInstance,
    isConnected,
    data,
    lastUpdate,
    refresh,
    doctors: (data?.doctors as any[]) || EMPTY_ARRAY,
    shifts: (data?.shifts as any[]) || EMPTY_ARRAY,
    leaves: (data?.leaves as any[]) || EMPTY_ARRAY,
    settings: data?.settings || null,
  }), [isConnected, data, lastUpdate]);
};
