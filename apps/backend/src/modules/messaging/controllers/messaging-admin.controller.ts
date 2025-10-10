import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
  DefaultValuePipe,
  Body,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiParam, ApiQuery } from '@nestjs/swagger';
import { BaseController } from '../../../common/controllers/base.controller';
import { AdminEndpoint } from '../../../common/decorators/api-endpoint.decorator';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Roles } from '../../../common/decorators/roles.decorator';
import { UserRole } from '../../../database/schemas/user.schema';
import type { UserDocument } from '../../../database/schemas/user.schema';
import { MessagingService } from '../messaging.service';
import { CreateConversationDto } from '../dto/create-conversation.dto';
import { SendMessageDto } from '../dto/send-message.dto';
import { ConversationListResponseDto } from '../dto/conversation-response.dto';
import { MessageListResponseDto } from '../dto/message-response.dto';
import {
  ConversationResponseDto,
  SingleMessageResponseDto,
  MessageDeletionResponseDto,
  MessagingStatsResponseDto,
  FlaggedMessageResponseDto,
} from '../dto/messaging-operation-response.dto';

/**
 * Admin Controller for Messaging
 * Handles administrative messaging management and moderation operations
 */
@Controller('admin/messaging')
@ApiTags('Messaging Management')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
export class MessagingAdminController extends BaseController {
  constructor(private readonly messagingService: MessagingService) {
    super();
  }

  @Get('conversations')
  @Roles(UserRole.ADMIN, UserRole.SYSTEM_ADMIN, UserRole.MODERATOR)
  @AdminEndpoint(
    'Get all conversations',
    'Retrieve all conversations with filtering for administrative management',
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
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Search by participant names or conversation type',
  })
  @ApiQuery({
    name: 'type',
    required: false,
    type: String,
    description: 'Filter by conversation type (booking, support, general)',
  })
  @ApiQuery({
    name: 'userId',
    required: false,
    type: String,
    description: 'Filter by user ID (participant)',
  })
  async getAllConversations(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('search') search?: string,
    @Query('type') type?: string,
  ): Promise<ConversationListResponseDto> {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        const result = await this.messagingService.findAllConversationsAdmin({
          page,
          limit: Math.min(limit, 100),
          search,
          type,
        });

        const conversations = result.data;

        return {
          items: conversations,
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: result.totalPages,
          hasNextPage: result.hasNextPage,
          hasPrevPage: result.hasPrevPage,
        };
      },
      'Get all conversations',
      'All Conversations List',
      'Conversations retrieved successfully',
      'Failed to retrieve conversations',
    );
  }

  @Get('conversations/:id')
  @Roles(UserRole.ADMIN, UserRole.SYSTEM_ADMIN, UserRole.MODERATOR, UserRole.SUPPORT)
  @AdminEndpoint(
    'Get conversation by ID',
    'Retrieve detailed information about a specific conversation',
    ConversationResponseDto,
  )
  @ApiParam({ name: 'id', description: 'Conversation ID' })
  async getConversationById(@Param('id') id: string): Promise<ConversationResponseDto> {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        const conversation = await this.messagingService.findConversationByIdAdmin(id);
        return conversation;
      },
      'Get conversation by ID',
      'Conversation retrieved successfully',
      'Failed to retrieve conversation',
    );
  }

  @Get('conversations/:id/messages')
  @Roles(UserRole.ADMIN, UserRole.SYSTEM_ADMIN, UserRole.MODERATOR, UserRole.SUPPORT)
  @AdminEndpoint(
    'Get conversation messages',
    'Retrieve all messages in a conversation for moderation and support',
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
  async getConversationMessages(
    @Param('id') conversationId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
  ): Promise<MessageListResponseDto> {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        const result = await this.messagingService.getMessagesAdmin(conversationId, {
          page,
          limit: Math.min(limit, 100),
        });

        const messages = result.data;

        return {
          items: messages,
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: result.totalPages,
          hasNextPage: result.hasNextPage,
          hasPrevPage: result.hasPrevPage,
        };
      },
      'Get conversation messages',
      'Conversation Messages',
      'Messages retrieved successfully',
      'Failed to retrieve messages',
    );
  }

  @Delete('conversations/:id')
  @Roles(UserRole.ADMIN, UserRole.SYSTEM_ADMIN)
  @AdminEndpoint(
    'Delete conversation',
    'Permanently delete a conversation (Admin only)',
    MessageDeletionResponseDto,
  )
  @ApiParam({ name: 'id', description: 'Conversation ID' })
  async deleteConversation(
    @Param('id') conversationId: string,
    @CurrentUser() adminUser: UserDocument,
  ): Promise<MessageDeletionResponseDto> {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        await this.messagingService.deleteConversationAdmin(conversationId, String(adminUser._id));
        return { deleted: true };
      },
      'Delete conversation',
      'Conversation deleted successfully',
      'Failed to delete conversation',
    );
  }

  @Delete('messages/:id')
  @Roles(UserRole.ADMIN, UserRole.SYSTEM_ADMIN, UserRole.MODERATOR, UserRole.SUPPORT)
  @AdminEndpoint(
    'Delete message',
    'Delete a message for moderation purposes',
    MessageDeletionResponseDto,
  )
  @ApiParam({ name: 'id', description: 'Message ID' })
  async deleteMessage(
    @Param('id') messageId: string,
    @CurrentUser() adminUser: UserDocument,
  ): Promise<MessageDeletionResponseDto> {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        await this.messagingService.deleteMessageAdmin(messageId, String(adminUser._id));
        return { deleted: true };
      },
      'Delete message',
      'Message deleted successfully',
      'Failed to delete message',
    );
  }

  @Post('conversations')
  @Roles(UserRole.ADMIN, UserRole.SYSTEM_ADMIN, UserRole.MODERATOR, UserRole.SUPPORT)
  @AdminEndpoint(
    'Create conversation',
    'Create a new conversation for administrative or support purposes',
    ConversationResponseDto,
  )
  async createConversation(
    @Body() createConversationDto: CreateConversationDto,
    @CurrentUser() adminUser: UserDocument,
  ): Promise<ConversationResponseDto> {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        const conversation = await this.messagingService.createConversation(
          createConversationDto,
          String(adminUser._id),
        );
        return conversation;
      },
      'Create conversation',
      'Create New Conversation',
      'Conversation created successfully',
      'Failed to create conversation',
    );
  }

  @Post('conversations/:id/messages')
  @Roles(UserRole.ADMIN, UserRole.SYSTEM_ADMIN, UserRole.MODERATOR, UserRole.SUPPORT)
  @AdminEndpoint(
    'Send message',
    'Send a message in a conversation as admin/moderator/support',
    SingleMessageResponseDto,
  )
  @ApiParam({ name: 'id', description: 'Conversation ID' })
  async sendMessage(
    @Param('id') conversationId: string,
    @Body() sendMessageDto: SendMessageDto,
    @CurrentUser() adminUser: UserDocument,
  ): Promise<SingleMessageResponseDto> {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        const message = await this.messagingService.sendMessage(
          conversationId,
          sendMessageDto,
          String(adminUser._id),
        );
        return message;
      },
      'Send message',
      'Send Admin Message',
      'Message sent successfully',
      'Failed to send message',
    );
  }

  @Put('messages/:id/flag')
  @Roles(UserRole.ADMIN, UserRole.SYSTEM_ADMIN, UserRole.MODERATOR)
  @AdminEndpoint('Flag message', 'Flag a message for moderation review', FlaggedMessageResponseDto)
  @ApiParam({ name: 'id', description: 'Message ID' })
  async flagMessage(
    @Param('id') messageId: string,
    @Body() body: { reason?: string },
    @CurrentUser() adminUser: UserDocument,
  ): Promise<FlaggedMessageResponseDto> {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        const message = await this.messagingService.flagMessageAdmin(
          messageId,
          String(adminUser._id),
          body.reason || 'Flagged by admin',
        );
        return {
          id: String(message._id),
          flagged: true,
          reason: body.reason || 'Flagged by admin',
        };
      },
      'Flag message',
      'Flag Message for Moderation',
      'Message flagged successfully',
      'Failed to flag message',
    );
  }

  @Get('statistics/overview')
  @Roles(UserRole.ADMIN, UserRole.SYSTEM_ADMIN)
  @AdminEndpoint(
    'Get messaging statistics',
    'Retrieve messaging analytics and overview statistics',
    MessagingStatsResponseDto,
  )
  @ApiQuery({ name: 'from', required: false, type: String, description: 'From date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'to', required: false, type: String, description: 'To date (YYYY-MM-DD)' })
  async getMessagingStatistics(
    @Query('from') from?: string,
    @Query('to') to?: string,
  ): Promise<MessagingStatsResponseDto> {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        return await this.messagingService.getStatisticsAdmin({ from, to });
      },
      'Get messaging statistics',
      'Messaging Analytics Overview',
      'Messaging statistics retrieved successfully',
      'Failed to retrieve messaging statistics',
    );
  }

  @Get('support-conversations')
  @Roles(UserRole.ADMIN, UserRole.SYSTEM_ADMIN, UserRole.SUPPORT)
  @AdminEndpoint(
    'Get support conversations',
    'Retrieve customer support conversations for admin and support staff',
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
  @ApiQuery({
    name: 'status',
    required: false,
    type: String,
    description: 'Filter by status (open, closed, pending)',
  })
  async getSupportConversations(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('status') status?: string,
  ): Promise<ConversationListResponseDto> {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        const result = await this.messagingService.getSupportConversationsAdmin({
          page,
          limit: Math.min(limit, 100),
          status,
        });

        const conversations = result.data;

        return {
          items: conversations,
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: result.totalPages,
          hasNextPage: result.hasNextPage,
          hasPrevPage: result.hasPrevPage,
        };
      },
      'Get support conversations',
      'Customer Support Conversations',
      'Support conversations retrieved successfully',
      'Failed to retrieve support conversations',
    );
  }
}
