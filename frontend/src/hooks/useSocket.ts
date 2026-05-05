import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useLogger } from './useLogger';

const SOCKET_URL = 'http://localhost:5000';

export const useSocket = (userId: string | undefined) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const { log } = useLogger();

  useEffect(() => {
    if (!userId) return;

    const newSocket = io(SOCKET_URL);
    setSocket(newSocket);

    newSocket.on('connect', () => {
      log('info', 'hook', `Socket connected: ${newSocket.id}`);
      newSocket.emit('join', userId);
    });

    newSocket.on('disconnect', () => {
      log('warn', 'hook', 'Socket disconnected');
    });

    return () => {
      newSocket.close();
    };
  }, [userId]);

  return socket;
};
