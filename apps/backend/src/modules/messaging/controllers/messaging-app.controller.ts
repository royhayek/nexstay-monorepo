import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { ApiTags, ApiParam, ApiQuery } from '@nestjs/swagger';
import { BaseController } from '../../../common/controllers/base.controller';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { ProtectedEndpoint } from '../../../common/decorators/api-endpoint.decorator';
import type { UserDocument } from '../../../database/schemas/user.schema';
import { MessagingService } from '../messaging.service';
import { CreateConversationDto } from '../dto/create-conversation.dto';
import { CreateSupportConversationDto } from '../dto/create-support-conversation.dto';
import { SendMessageDto } from '../dto/send-message.dto';
import { MessageListResponseDto, MessageResponseDto } from '../dto/message-response.dto';
import {
  ConversationResponseDto,
  SingleMessageResponseDto,
  ReadStatusResponseDto,
  UnreadCountResponseDto,
} from '../dto/messaging-operation-response.dto';
import { ConversationListResponseDto } from '../dto/conversation-response.dto';

/**
 * App Controller for Messaging
 * Handles messaging operations for mobile app and website users
 */
@Controller('app/messaging')
@ApiTags('Messaging')
export class MessagingAppController extends BaseController {
  constructor(private readonly messagingService: MessagingService) {
    super();
  }

  @Get('conversations')
  @ProtectedEndpoint(
    'Get user conversations',
    'Retrieve paginated list of user conversations',
    ConversationListResponseDto,
  )
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (default: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page (default: 20, max: 100)',
  })
  async getConversations(
    @CurrentUser() user: UserDocument,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        const result = await this.messagingService.getUserConversations(String(user._id), {
          page,
          limit: Math.min(limit, 100),
        });

        const conversations = result.data;

        return {
          conversations,
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: result.totalPages,
          hasNextPage: result.hasNextPage,
          hasPrevPage: result.hasPrevPage,
        };
      },
      'Get conversations',
      'Conversations',
      'Conversations retrieved successfully',
      'Failed to retrieve conversations',
    );
  }

  @Post('conversations')
  @ProtectedEndpoint(
    'Create a new conversation',
    'Start a new conversation with participants',
    ConversationResponseDto,
  )
  async createConversation(
    @Body() createConversationDto: CreateConversationDto,
    @CurrentUser() user: UserDocument,
  ) {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        const conversation = await this.messagingService.createConversation(
          createConversationDto,
          String(user._id),
        );
        return conversation;
      },
      'Create conversation',
      'Conversation Created',
      'Conversation created successfully',
      'Failed to create conversation',
    );
  }

  @Post('conversations/support')
  @ProtectedEndpoint(
    'Create a support conversation',
    'Create a new conversation for customer support',
    ConversationResponseDto,
  )
  async createSupportConversation(
    @Body() createSupportConversationDto: CreateSupportConversationDto,
    @CurrentUser() user: UserDocument,
  ): Promise<ConversationResponseDto> {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        const conversation = await this.messagingService.createSupportConversation(
          createSupportConversationDto,
          String(user._id),
        );
        return conversation;
      },
      'Create support conversation',
      'Support Conversation Created',
      'Support conversation created successfully',
      'Failed to create support conversation',
    );
  }

  @Get('conversations/:id')
  @ProtectedEndpoint(
    'Get conversation by ID',
    'Retrieve a specific conversation by its ID',
    ConversationResponseDto,
  )
  @ApiParam({ name: 'id', description: 'Conversation ID' })
  async getConversation(
    @Param('id') id: string,
    @CurrentUser() user: UserDocument,
  ): Promise<ConversationResponseDto> {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        const conversation = await this.messagingService.getConversationById(id, String(user._id));
        return conversation;
      },
      'Get conversation',
      'Conversation Details',
      'Conversation retrieved successfully',
      'Failed to retrieve conversation',
    );
  }

  @Get('conversations/:id/messages')
  @ProtectedEndpoint(
    'Get messages in a conversation',
    'Retrieve paginated messages from a specific conversation',
    MessageListResponseDto,
  )
  @ApiParam({ name: 'id', description: 'Conversation ID' })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (default: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page (default: 50, max: 100)',
  })
  async getMessages(
    @Param('id') id: string,
    @CurrentUser() user: UserDocument,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
  ): Promise<MessageListResponseDto> {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        const result = await this.messagingService.getMessages(id, String(user._id), {
          page,
          limit: Math.min(limit, 100),
        });

        const messages = result.messages;

        return {
          items: messages,
          total: result.pagination.total,
          page: result.pagination.page,
          limit: result.pagination.limit,
          totalPages: result.pagination.pages,
          hasNextPage: result.pagination.hasNext,
          hasPrevPage: result.pagination.hasPrev,
        };
      },
      'Get messages',
      'Messages',
      'Messages retrieved successfully',
      'Failed to retrieve messages',
    );
  }

  @Post('conversations/:id/messages')
  @ProtectedEndpoint(
    'Send a message in a conversation',
    'Send a new message to an existing conversation',
    SingleMessageResponseDto,
  )
  @ApiParam({ name: 'id', description: 'Conversation ID' })
  async sendMessage(
    @Param('id') conversationId: string,
    @Body() sendMessageDto: SendMessageDto,
    @CurrentUser() user: UserDocument,
  ): Promise<MessageResponseDto> {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        const message = await this.messagingService.sendMessage(
          conversationId,
          sendMessageDto,
          String(user._id),
        );
        return message;
      },
      'Send message',
      'Message Sent',
      'Message sent successfully',
      'Failed to send message',
    );
  }

  @Post('conversations/:id/mark-read')
  @ProtectedEndpoint(
    'Mark conversation as read',
    'Mark all messages in a conversation as read by the current user',
    ReadStatusResponseDto,
  )
  @ApiParam({ name: 'id', description: 'Conversation ID' })
  async markAsRead(@Param('id') conversationId: string, @CurrentUser() user: UserDocument) {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        await this.messagingService.markAsRead(conversationId, String(user._id));
        // Note: For proper implementation, integrate with a method to get total unread count
        return { markedAsRead: true, unreadCount: 0 };
      },
      'Mark as read',
      'Marked as Read',
      'Conversation marked as read',
      'Failed to mark conversation as read',
    );
  }

  @Get('unread-count')
  @ProtectedEndpoint(
    'Get unread messages count',
    'Retrieve the total count of unread messages for the current user',
    UnreadCountResponseDto,
  )
  async getUnreadCount(@CurrentUser() user: UserDocument) {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        const count = await this.messagingService.getTotalUnreadCount(String(user._id));
        return { unreadCount: count };
      },
      'Get unread count',
      'Unread Count',
      'Unread count retrieved successfully',
      'Failed to retrieve unread count',
    );
  }
}
