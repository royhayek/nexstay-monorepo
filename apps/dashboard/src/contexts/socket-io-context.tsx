'use client';

import type { Socket } from 'socket.io-client';
import type { MessageDataDto } from 'src/api/models/admin';

import { io } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';
import { useState, useEffect, useContext, useCallback, createContext } from 'react';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  sendMessage: (conversationId: string, content: string) => void;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  sendMessage: () => {},
});

interface SocketProviderProps {
  children: React.ReactNode;
}

export function SocketProvider({ children }: SocketProviderProps) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    // Initialize Socket.IO connection
    const socketInstance = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3000', {
      transports: ['websocket'],
      autoConnect: true,
    });

    socketInstance.on('connect', () => {
      console.log('Socket connected:', socketInstance.id);
      setIsConnected(true);
    });

    socketInstance.on('disconnect', () => {
      console.log('Socket disconnected');
      setIsConnected(false);
    });

    // Listen for new messages
    socketInstance.on('new_message', (message: MessageDataDto) => {
      console.log('New message received:', message);

      // Invalidate messages query to refetch
      queryClient.invalidateQueries({
        queryKey: [`/v1/messaging/conversations/${message.conversation_id}/messages`],
      });

      // Invalidate conversations list to update last message
      queryClient.invalidateQueries({
        queryKey: ['/v1/messaging/conversations'],
      });
    });

    // Listen for message read receipts
    socketInstance.on(
      'message_read',
      (data: { conversationId: string; messageId: string; userId: string }) => {
        console.log('Message read:', data);

        // Update the specific message read status
        queryClient.invalidateQueries({
          queryKey: [`/v1/messaging/conversations/${data.conversationId}/messages`],
        });
      }
    );

    // Listen for conversation updates
    socketInstance.on('conversation_updated', (conversationId: string) => {
      console.log('Conversation updated:', conversationId);

      queryClient.invalidateQueries({
        queryKey: [`/v1/messaging/conversations/${conversationId}`],
      });

      queryClient.invalidateQueries({
        queryKey: ['/v1/messaging/conversations'],
      });
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [queryClient]);

  const sendMessage = useCallback(
    (conversationId: string, content: string) => {
      if (socket && isConnected) {
        socket.emit('send_message', {
          conversationId,
          content,
          messageType: 'TEXT',
        });
      }
    },
    [socket, isConnected]
  );

  const value = {
    socket,
    isConnected,
    sendMessage,
  };

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
}
