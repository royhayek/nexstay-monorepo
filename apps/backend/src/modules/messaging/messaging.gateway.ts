import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { LoggingUtil } from '../../common/utils/logging.util';
import { JwtService } from '@nestjs/jwt';
import { MessagingService } from './messaging.service';
import { SendMessageDto } from './dto/send-message.dto';
import { MessageDataDto } from './dto/message-response.dto';

interface JwtPayload {
  sub: string;
  email?: string;
  iat?: number;
  exp?: number;
}

interface AuthenticatedSocket extends Socket {
  userId?: string;
}

interface OnlineStatusData {
  userId: string;
  isOnline: boolean;
}

interface SocketResponseData {
  onlineStatus?: OnlineStatusData[];
  message?: MessageDataDto;
}

interface SocketResponse {
  success: boolean;
  message: string;
  data?: SocketResponseData;
  error?: string;
}

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: '/messaging',
})
export class MessagingGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private connectedUsers = new Map<string, string>(); // userId -> socketId

  constructor(
    private readonly jwtService: JwtService,
    private readonly messagingService: MessagingService,
  ) {}

  async handleConnection(client: AuthenticatedSocket): Promise<void> {
    try {
      const authToken = client.handshake.auth?.token as string;
      const authHeader = client.handshake.headers?.authorization as string;
      const token = authToken || authHeader?.replace('Bearer ', '');

      if (!token) {
        LoggingUtil.warn('Connection attempt without token');
        client.disconnect();
        return;
      }

      const payload = await this.jwtService.verifyAsync<JwtPayload>(token);
      client.userId = payload.sub;

      this.connectedUsers.set(payload.sub, client.id);
      await client.join(`user_${payload.sub}`);

      LoggingUtil.log(`User ${payload.sub} connected to messaging with socket ${client.id}`);

      // Emit user online status to their conversations
      client.emit('connected', {
        message: 'Connected to messaging service',
        userId: payload.sub,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      LoggingUtil.error('Authentication failed for socket connection', errorMessage);
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket): void {
    if (client.userId) {
      this.connectedUsers.delete(client.userId);
      LoggingUtil.log(`User ${client.userId} disconnected from messaging`);
    }
  }

  @SubscribeMessage('join_conversation')
  async handleJoinConversation(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { conversationId: string },
  ): Promise<SocketResponse> {
    if (!client.userId) {
      return { success: false, message: 'User not authenticated', error: 'User not authenticated' };
    }

    try {
      // Verify user is participant in the conversation
      // This would typically involve checking with the messaging service
      await client.join(`conversation_${data.conversationId}`);

      LoggingUtil.log(`User ${client.userId} joined conversation ${data.conversationId}`);

      return { success: true, message: 'Joined conversation successfully' };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      LoggingUtil.error(`Failed to join conversation: ${errorMessage}`);
      return { success: false, message: 'Failed to join conversation', error: errorMessage };
    }
  }

  @SubscribeMessage('leave_conversation')
  async handleLeaveConversation(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { conversationId: string },
  ): Promise<SocketResponse> {
    if (!client.userId) {
      return { success: false, message: 'User not authenticated', error: 'User not authenticated' };
    }

    await client.leave(`conversation_${data.conversationId}`);
    LoggingUtil.log(`User ${client.userId} left conversation ${data.conversationId}`);

    return { success: true, message: 'Left conversation successfully' };
  }

  @SubscribeMessage('send_message')
  async handleSendMessage(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { conversationId: string; message: SendMessageDto },
  ): Promise<SocketResponse> {
    if (!client.userId) {
      return { success: false, message: 'User not authenticated', error: 'User not authenticated' };
    }

    try {
      const message = await this.messagingService.sendMessage(
        data.conversationId,
        data.message,
        client.userId,
      );

      // Broadcast the new message to all participants in the conversation
      this.server.to(`conversation_${data.conversationId}`).emit('new_message', {
        conversationId: data.conversationId,
        message,
      });

      LoggingUtil.log(
        `Message sent in conversation ${data.conversationId} by user ${client.userId}`,
      );

      return { success: true, message: 'Message sent successfully', data: { message } };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      LoggingUtil.error(`Failed to send message: ${errorMessage}`);
      return { success: false, message: 'Failed to send message', error: errorMessage };
    }
  }

  @SubscribeMessage('typing_start')
  handleTypingStart(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { conversationId: string },
  ): SocketResponse {
    if (!client.userId) {
      return { success: false, message: 'User not authenticated', error: 'User not authenticated' };
    }

    // Broadcast typing indicator to other participants (exclude sender)
    client.to(`conversation_${data.conversationId}`).emit('user_typing', {
      conversationId: data.conversationId,
      userId: client.userId,
      typing: true,
    });

    return { success: true, message: 'Typing indicator sent' };
  }

  @SubscribeMessage('typing_stop')
  handleTypingStop(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { conversationId: string },
  ): SocketResponse {
    if (!client.userId) {
      return { success: false, message: 'User not authenticated', error: 'User not authenticated' };
    }

    // Broadcast typing stopped to other participants
    client.to(`conversation_${data.conversationId}`).emit('user_typing', {
      conversationId: data.conversationId,
      userId: client.userId,
      typing: false,
    });

    return { success: true, message: 'Typing stopped indicator sent' };
  }

  @SubscribeMessage('mark_as_read')
  async handleMarkAsRead(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { messageId: string },
  ): Promise<SocketResponse> {
    if (!client.userId) {
      return { success: false, message: 'User not authenticated', error: 'User not authenticated' };
    }

    try {
      await this.messagingService.markAsRead(data.messageId, client.userId);

      // Optionally broadcast read receipt to other participants
      // This would require getting the conversation ID from the message

      return { success: true, message: 'Message marked as read' };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      LoggingUtil.error(`Failed to mark message as read: ${errorMessage}`);
      return { success: false, message: 'Failed to mark message as read', error: errorMessage };
    }
  }

  @SubscribeMessage('get_online_status')
  handleGetOnlineStatus(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { userIds: string[] },
  ): SocketResponse {
    if (!client.userId) {
      return { success: false, message: 'User not authenticated', error: 'User not authenticated' };
    }

    const onlineStatus = data.userIds.map((userId) => ({
      userId,
      isOnline: this.connectedUsers.has(userId),
    }));

    return { success: true, message: 'Online status retrieved', data: { onlineStatus } };
  }

  // Helper methods for external services to send messages
  sendMessageToUsers(userIds: string[], event: string, data: Record<string, any>): void {
    userIds.forEach((userId) => {
      this.server.to(`user_${userId}`).emit(event, data);
    });
  }

  sendMessageToConversation(
    conversationId: string,
    event: string,
    data: Record<string, any>,
  ): void {
    this.server.to(`conversation_${conversationId}`).emit(event, data);
  }

  broadcastToAll(event: string, data: Record<string, any>): void {
    this.server.emit(event, data);
  }

  getUserOnlineStatus(userId: string): boolean {
    return this.connectedUsers.has(userId);
  }

  getOnlineUsers(): string[] {
    return Array.from(this.connectedUsers.keys());
  }

  getConnectedUsersCount(): number {
    return this.connectedUsers.size;
  }
}
