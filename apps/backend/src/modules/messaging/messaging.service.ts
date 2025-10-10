import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { DateUtils } from '../../common/utils/date.utils';
import { ConfigService } from '@nestjs/config';
import { Model, Types } from 'mongoose';
import { createCipheriv, createDecipheriv, randomBytes, scrypt } from 'crypto';
import { promisify } from 'util';
import { validatePagination, buildPaginatedResult } from '../../common/utils/database.utils';
import { LoggingUtil } from '../../common/utils/logging.util';
import { ValidationUtils } from '../../common/utils/validation.utils';
import {
  Conversation,
  ConversationDocument,
  ConversationType,
  SupportTicketStatus,
  ConversationPriority,
} from '../../database/schemas/conversation.schema';
import { Message, MessageDocument, MessageType } from '../../database/schemas/message.schema';
import { User, UserDocument, UserRole } from '../../database/schemas/user.schema';
import {
  UserPresenceStatus,
  calculatePresenceFromActivity,
  isUserActiveForSupport,
} from '../../common/enums/user-presence.enums';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { CreateSupportConversationDto } from './dto/create-support-conversation.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { ConversationDataDto, ConversationParticipantDto } from './dto/conversation-response.dto';
import { MessageDataDto, MessageReadReceiptDto } from './dto/message-response.dto';
import { PaginationDto, PaginationResponseDto } from './dto/pagination.dto';
import {
  PopulatedUser,
  PopulatedMessage,
  PopulatedConversation,
  TransformableUser,
  PaginatedResult,
  ConversationFilters,
  MessageFilters,
  ConversationQueryFilter,
  SupportAgentResult,
  DateFilter,
  MessageStatsResult,
  ConversationStatsResult,
  MessagingStats,
  DateRangeFilter,
} from './messaging-types';

/**
 * Comprehensive Messaging Service
 *
 * This service handles all messaging functionality including:
 * - Conversation management (create, get, update)
 * - Message operations (send, read, delete)
 * - Admin functionality (statistics, management)
 * - User support conversations
 * - Message encryption/decryption
 * - Data transformation and formatting
 *
 * The service is organized into the following sections:
 * 1. Encryption & Security Methods
 * 2. Conversation Management Methods
 * 3. Message Operations Methods
 * 4. Admin & Statistics Methods
 * 5. Data Transformation Methods
 * 6. Utility & Helper Methods
 */
@Injectable()
export class MessagingService {
  private readonly encryptionKey: string;
  private readonly scryptAsync = promisify(scrypt);

  constructor(
    @InjectModel(Conversation.name)
    private conversationModel: Model<ConversationDocument>,
    @InjectModel(Message.name)
    private messageModel: Model<MessageDocument>,
    @InjectModel(User.name)
    private userModel: Model<UserDocument>,
    private configService: ConfigService,
  ) {
    this.encryptionKey = this.configService.get<string>(
      'MESSAGE_ENCRYPTION_KEY',
      'default-message-encryption-key-change-in-production',
    );
  }

  // ================================================================================================
  // 1. ENCRYPTION & SECURITY METHODS
  // ================================================================================================

  /**
   * Encrypts message content before storing in database
   */
  private async encryptMessage(content: string): Promise<string> {
    try {
      const iv = randomBytes(16);
      const key = (await this.scryptAsync(this.encryptionKey, 'salt', 32)) as Buffer;
      const cipher = createCipheriv('aes-256-cbc', key, iv);

      let encrypted = cipher.update(content, 'utf8', 'hex');
      encrypted += cipher.final('hex');

      // Prepend IV to encrypted content for decryption
      return iv.toString('hex') + ':' + encrypted;
    } catch (error) {
      LoggingUtil.errorWithException('Failed to encrypt message', error, 'MessagingService');
      throw new Error('Message encryption failed');
    }
  }

  /**
   * Decrypts message content when retrieving from database
   */
  private async decryptMessage(encryptedContent: string): Promise<string> {
    try {
      const [ivHex, encrypted] = encryptedContent.split(':');
      if (!ivHex || !encrypted) {
        throw new Error('Invalid encrypted content format');
      }

      const iv = Buffer.from(ivHex, 'hex');
      const key = (await this.scryptAsync(this.encryptionKey, 'salt', 32)) as Buffer;
      const decipher = createDecipheriv('aes-256-cbc', key, iv);

      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      LoggingUtil.errorWithException('Failed to decrypt message', error, 'MessagingService');
      // Return a placeholder instead of failing completely
      return '[Message could not be decrypted]';
    }
  }

  /**
   * Checks if content appears to be encrypted (contains IV separator)
   */
  private isEncrypted(content: string): boolean {
    return content.includes(':') && content.split(':').length === 2;
  }

  // ================================================================================================
  // 2. CONVERSATION MANAGEMENT METHODS
  // ================================================================================================

  async createSupportConversation(
    createDto: CreateSupportConversationDto,
    userId: string,
  ): Promise<ConversationDataDto> {
    // Get a random available support agent
    const supportAgent = await this.getAvailableSupportAgent();
    if (!supportAgent) {
      throw new NotFoundException('No support agents available at the moment');
    }

    const participants = [userId, supportAgent._id.toString()];

    const conversation = new this.conversationModel({
      participants: participants.map((id) => new Types.ObjectId(id)),
      title: createDto.title,
      type: createDto.type,
      priority: createDto.priority || ConversationPriority.NORMAL,
      support_category: createDto.support_category,
      support_status: SupportTicketStatus.OPEN,
      assigned_support_agent: new Types.ObjectId(supportAgent._id),
      metadata: createDto.metadata || {},
    });

    await conversation.save();

    // Send initial message
    const encryptedContent = await this.encryptMessage(createDto.initial_message);
    const initialMessage = new this.messageModel({
      conversation_id: conversation._id,
      sender_id: new Types.ObjectId(userId),
      content: encryptedContent,
      message_type: MessageType.TEXT,
      attachments: [],
      metadata: { is_initial: true },
    });

    await initialMessage.save();

    // Update conversation with last message
    conversation.last_message_id = initialMessage._id as Types.ObjectId;
    conversation.last_activity = DateUtils.now();
    await conversation.save();

    // Populate the conversation with participant details
    await conversation.populate('participants', 'firstName lastName avatarUrl');
    await conversation.populate('supportAgent', 'firstName lastName avatarUrl');

    LoggingUtil.log(
      `Created support conversation ${String(conversation._id)} for user ${userId} with agent ${String(supportAgent._id)}`,
      'MessagingService',
    );

    return await this.formatConversationResponse(conversation as PopulatedConversation, userId);
  }

  async createConversation(
    createDto: CreateConversationDto,
    userId: string,
  ): Promise<ConversationDataDto> {
    // Validate that the creating user is one of the participants
    if (!createDto.participants.includes(userId)) {
      createDto.participants.push(userId);
    }

    // Check if conversation already exists for these participants and booking/property
    const existingConversation = await this.findExistingConversation(
      createDto.participants,
      createDto.booking_id,
      createDto.property_id,
    );

    if (existingConversation) {
      return await this.formatConversationResponse(
        existingConversation as PopulatedConversation,
        userId,
      );
    }

    // Validate all participants exist
    const participants = await this.userModel
      .find({
        _id: { $in: createDto.participants.map((id) => new Types.ObjectId(id)) },
        deletedAt: null,
      })
      .select('_id firstName lastName avatarUrl');

    if (participants.length !== createDto.participants.length) {
      throw new NotFoundException('One or more participants not found');
    }

    const conversation = new this.conversationModel({
      participants: createDto.participants.map((id) => new Types.ObjectId(id)),
      title: createDto.title,
      type: createDto.type || ConversationType.GENERAL,
      priority: createDto.priority || ConversationPriority.NORMAL,
      support_category: createDto.support_category,
      booking_id: createDto.booking_id ? new Types.ObjectId(createDto.booking_id) : undefined,
      property_id: createDto.property_id ? new Types.ObjectId(createDto.property_id) : undefined,
      metadata: createDto.metadata || {},
    });

    await conversation.save();

    // Populate the conversation with participant details
    await conversation.populate('participants', 'firstName lastName avatarUrl');

    LoggingUtil.log(
      `Created conversation ${String(conversation._id)} with ${participants.length} participants`,
      'MessagingService',
    );

    return await this.formatConversationResponse(conversation as PopulatedConversation, userId);
  }

  // ================================================================================================
  // 3. MESSAGE OPERATIONS METHODS
  // ================================================================================================

  async sendMessage(
    conversationId: string,
    sendMessageDto: SendMessageDto,
    senderId: string,
  ): Promise<MessageDataDto> {
    const conversation = await this.conversationModel.findById(conversationId);
    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    // Verify sender is participant
    const isParticipant = conversation.participants.some(
      (participant) => participant.toString() === senderId,
    );
    if (!isParticipant) {
      throw new ForbiddenException('User is not a participant in this conversation');
    }

    // Validate reply_to message if provided
    if (sendMessageDto.reply_to) {
      const replyToMessage = await this.messageModel.findOne({
        _id: sendMessageDto.reply_to,
        conversation_id: new Types.ObjectId(conversationId),
        is_deleted: false,
      });
      if (!replyToMessage) {
        throw new NotFoundException('Reply-to message not found');
      }
    }

    // Encrypt message content before storing
    const encryptedContent = await this.encryptMessage(sendMessageDto.content);

    const message = new this.messageModel({
      conversation_id: new Types.ObjectId(conversationId),
      sender_id: new Types.ObjectId(senderId),
      content: encryptedContent,
      message_type: sendMessageDto.message_type,
      attachments: sendMessageDto.attachments || [],
      reply_to: sendMessageDto.reply_to ? new Types.ObjectId(sendMessageDto.reply_to) : undefined,
      metadata: sendMessageDto.metadata || {},
    });

    await message.save();

    // Update conversation last activity and last message
    conversation.last_message_id = message._id as Types.ObjectId;
    conversation.last_activity = DateUtils.now();
    await conversation.save();

    // Populate sender information
    await message.populate('sender', 'firstName lastName avatarUrl');
    await message.populate({
      path: 'read_by.user_id',
      select: 'firstName lastName avatarUrl',
    });

    LoggingUtil.log(
      `Message ${String(message._id)} sent in conversation ${conversationId}`,
      'MessagingService',
    );

    return await this.formatMessageResponse(message as PopulatedMessage, senderId);
  }

  async markAsRead(messageId: string, userId: string): Promise<void> {
    const message = await this.messageModel.findById(messageId);
    if (!message) {
      throw new NotFoundException('Message not found');
    }

    // Check if user is participant in the conversation
    const conversation = await this.conversationModel.findById(message.conversation_id);
    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    const isParticipant = conversation.participants.some(
      (participant) => participant.toString() === userId,
    );
    if (!isParticipant) {
      throw new ForbiddenException('Access denied');
    }

    // Check if user has already read this message
    const hasRead = message.read_by.some((receipt) => receipt.user_id.toString() === userId);

    if (!hasRead) {
      await this.messageModel.findByIdAndUpdate(messageId, {
        $addToSet: {
          read_by: {
            user_id: new Types.ObjectId(userId),
            read_at: DateUtils.now(),
          },
        },
      });

      LoggingUtil.log(`Message ${messageId} marked as read by user ${userId}`, 'MessagingService');
    }
  }

  async markConversationAsRead(conversationId: string, userId: string): Promise<void> {
    const conversation = await this.conversationModel.findById(conversationId);
    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    // Verify user is participant
    const isParticipant = conversation.participants.some(
      (participant) => participant.toString() === userId,
    );
    if (!isParticipant) {
      throw new ForbiddenException('Access denied');
    }

    // Mark all unread messages as read
    await this.messageModel.updateMany(
      {
        conversation_id: new Types.ObjectId(conversationId),
        is_deleted: false,
        'read_by.user_id': { $ne: new Types.ObjectId(userId) },
      },
      {
        $addToSet: {
          read_by: {
            user_id: new Types.ObjectId(userId),
            read_at: DateUtils.now(),
          },
        },
      },
    );

    LoggingUtil.log(
      `All messages in conversation ${conversationId} marked as read by user ${userId}`,
      'MessagingService',
    );
  }

  async getSupportConversations(
    userId: string,
    pagination: PaginationDto,
    status?: SupportTicketStatus,
  ): Promise<{
    conversations: ConversationDataDto[];
    pagination: PaginationResponseDto;
  }> {
    // Verify user has support role
    const user = await this.userModel.findById(userId);
    if (!user?.roles.includes(UserRole.SUPPORT) && !user?.roles.includes(UserRole.ADMIN)) {
      throw new ForbiddenException('Access denied - insufficient permissions');
    }

    const { page, limit, skip } = validatePagination({
      page: pagination.page || 1,
      limit: pagination.limit || 20,
      maxLimit: 100,
    });

    const query: ConversationQueryFilter = {
      type: { $in: [ConversationType.SUPPORT_GUEST, ConversationType.SUPPORT_HOST] },
      is_active: true,
    };

    if (status) {
      query.support_status = status;
    }

    // If user is support agent (not admin), only show assigned conversations
    if (user.roles.includes(UserRole.SUPPORT) && !user.roles.includes(UserRole.ADMIN)) {
      query.assigned_support_agent = new Types.ObjectId(userId);
    }

    const [conversations, total] = await Promise.all([
      this.conversationModel
        .find(query)
        .populate('participants', 'firstName lastName avatarUrl')
        .populate('supportAgent', 'firstName lastName avatarUrl')
        .populate('lastMessage')
        .populate('booking', 'property_id check_in check_out')
        .populate('property', 'name images')
        .sort({ priority: -1, last_activity: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.conversationModel.countDocuments(query),
    ]);

    const formattedConversations = await Promise.all(
      conversations.map((conversation) =>
        this.formatConversationResponse(conversation as PopulatedConversation, userId),
      ),
    );

    const paginationResult = buildPaginatedResult(formattedConversations, total, page, limit);

    return {
      conversations: paginationResult.data,
      pagination: {
        page: paginationResult.page,
        limit: paginationResult.limit,
        total: paginationResult.total,
        pages: paginationResult.totalPages,
        hasNext: paginationResult.hasNextPage,
        hasPrev: paginationResult.hasPrevPage,
      },
    };
  }

  async getConversations(
    userId: string,
    pagination: PaginationDto,
    type?: ConversationType,
  ): Promise<{
    conversations: ConversationDataDto[];
    pagination: PaginationResponseDto;
  }> {
    const { page, limit, skip } = validatePagination({
      page: pagination.page || 1,
      limit: pagination.limit || 20,
      maxLimit: 100,
    });

    const query: ConversationQueryFilter = {
      participants: new Types.ObjectId(userId),
      is_active: true,
    };

    // Filter by conversation type if specified
    if (type) {
      query.type = type;
    } else {
      // Exclude support conversations for regular users (they should use getSupportConversations)
      query.type = {
        $nin: [ConversationType.SUPPORT_GUEST, ConversationType.SUPPORT_HOST],
      };
    }

    const [conversations, total] = await Promise.all([
      this.conversationModel
        .find(query)
        .populate('participants', 'firstName lastName avatarUrl')
        .populate('lastMessage')
        .populate('booking', 'property_id check_in check_out')
        .populate('property', 'name images')
        .sort({ last_activity: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.conversationModel.countDocuments(query),
    ]);

    const formattedConversations = await Promise.all(
      conversations.map((conversation) =>
        this.formatConversationResponse(conversation as PopulatedConversation, userId),
      ),
    );

    const paginationResult = buildPaginatedResult(formattedConversations, total, page, limit);

    return {
      conversations: paginationResult.data,
      pagination: {
        page: paginationResult.page,
        limit: paginationResult.limit,
        total: paginationResult.total,
        pages: paginationResult.totalPages,
        hasNext: paginationResult.hasNextPage,
        hasPrev: paginationResult.hasPrevPage,
      },
    };
  }

  async getMessages(
    conversationId: string,
    userId: string,
    pagination: PaginationDto,
  ): Promise<{
    messages: MessageDataDto[];
    pagination: PaginationResponseDto;
  }> {
    // Verify user is participant
    const conversation = await this.conversationModel.findById(conversationId);
    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    const isParticipant = conversation.participants.some(
      (participant) => participant.toString() === userId,
    );
    if (!isParticipant) {
      throw new ForbiddenException('Access denied');
    }

    const { page, limit, skip } = validatePagination({
      page: pagination.page || 1,
      limit: pagination.limit || 50,
      maxLimit: 100,
    });

    const [messages, total] = await Promise.all([
      this.messageModel
        .find({ conversation_id: new Types.ObjectId(conversationId), is_deleted: false })
        .populate('sender', 'firstName lastName avatarUrl')
        .populate({
          path: 'read_by.user_id',
          select: 'firstName lastName avatarUrl',
        })
        .populate({
          path: 'reply_to',
          populate: [
            {
              path: 'sender_id',
              select: 'firstName lastName avatarUrl',
            },
            {
              path: 'read_by.user_id',
              select: 'firstName lastName avatarUrl',
            },
          ],
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.messageModel.countDocuments({
        conversation_id: new Types.ObjectId(conversationId),
        is_deleted: false,
      }),
    ]);

    const formattedMessages = await Promise.all(
      messages
        .reverse()
        .map((message) => this.formatMessageResponse(message as PopulatedMessage, userId)),
    );

    const paginationResult = buildPaginatedResult(formattedMessages, total, page, limit);

    return {
      messages: paginationResult.data,
      pagination: {
        page: paginationResult.page,
        limit: paginationResult.limit,
        total: paginationResult.total,
        pages: paginationResult.totalPages,
        hasNext: paginationResult.hasNextPage,
        hasPrev: paginationResult.hasPrevPage,
      },
    };
  }

  async deleteMessage(messageId: string, userId: string): Promise<void> {
    const message = await this.messageModel.findById(messageId);
    if (!message) {
      throw new NotFoundException('Message not found');
    }

    // Only the sender can delete their message
    if (message.sender_id.toString() !== userId) {
      throw new ForbiddenException('Only the sender can delete this message');
    }

    message.is_deleted = true;
    message.deleted_at = DateUtils.now();
    await message.save();

    LoggingUtil.log(`Message ${messageId} deleted by user ${userId}`, 'MessagingService');
  }

  async getConversationById(conversationId: string, userId: string): Promise<ConversationDataDto> {
    const conversation = await this.conversationModel
      .findById(conversationId)
      .populate('participants', 'firstName lastName avatarUrl')
      .populate('lastMessage')
      .populate('booking', 'property_id check_in check_out')
      .populate('property', 'name images');

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    // Verify user is participant
    const isParticipant = conversation.participants.some(
      (participant) => participant._id.toString() === userId,
    );
    if (!isParticipant) {
      throw new ForbiddenException('Access denied - user is not a participant');
    }

    return await this.formatConversationResponse(conversation as PopulatedConversation, userId);
  }

  private async findExistingConversation(
    participants: string[],
    bookingId?: string,
    propertyId?: string,
  ): Promise<ConversationDocument | null> {
    const query: ConversationQueryFilter = {
      participants: {
        $all: participants.map((id) => new Types.ObjectId(id)),
        $size: participants.length,
      },
      is_active: true,
    };

    if (bookingId) {
      query.booking_id = new Types.ObjectId(bookingId);
    }
    if (propertyId) {
      query.property_id = new Types.ObjectId(propertyId);
    }

    return this.conversationModel
      .findOne(query)
      .populate('participants lastMessage') as Promise<ConversationDocument | null>;
  }

  /**
   * Get unread message count for a user in a specific conversation
   */
  async getConversationUnreadCount(conversationId: string, userId: string): Promise<number> {
    return this.messageModel.countDocuments({
      conversation_id: new Types.ObjectId(conversationId),
      sender_id: { $ne: new Types.ObjectId(userId) }, // Don't count own messages
      is_deleted: false,
      'read_by.user_id': { $ne: new Types.ObjectId(userId) }, // User hasn't read it
    });
  }

  /**
   * Get total unread message count for a user across all conversations
   */
  async getTotalUnreadCount(userId: string): Promise<number> {
    return this.messageModel.countDocuments({
      sender_id: { $ne: new Types.ObjectId(userId) }, // Don't count own messages
      is_deleted: false,
      'read_by.user_id': { $ne: new Types.ObjectId(userId) }, // User hasn't read it
    });
  }

  /**
   * Get total unread messages count in a conversation (for admin view)
   * Counts messages that haven't been read by all non-sender participants
   */
  async getConversationTotalUnreadCount(conversationId: string): Promise<number> {
    // Get all messages in the conversation
    const messages = await this.messageModel
      .find({
        conversation_id: new Types.ObjectId(conversationId),
        is_deleted: false,
      })
      .select('_id sender_id read_by')
      .lean();

    // Get conversation participants
    const conversation = await this.conversationModel
      .findById(conversationId)
      .select('participants')
      .lean();
    if (!conversation) return 0;

    let unreadCount = 0;
    for (const message of messages) {
      const participantsWhoShouldRead = conversation.participants.filter(
        (participantId) => !participantId.equals(message.sender_id),
      );

      const readByUserIds = message.read_by?.map((receipt) => receipt.user_id) || [];
      const unreadParticipants = participantsWhoShouldRead.filter(
        (participantId) => !readByUserIds.some((readerId) => readerId.equals(participantId)),
      );

      if (unreadParticipants.length > 0) {
        unreadCount++;
      }
    }

    return unreadCount;
  }

  // ================================================================================================
  // 4. UTILITY & HELPER METHODS
  // ================================================================================================

  private async getAvailableSupportAgent(): Promise<SupportAgentResult | null> {
    // Find support agents who are active, available for support, and have presence info
    const supportAgents = await this.userModel
      .find({
        roles: UserRole.SUPPORT,
        deletedAt: null,
      })
      .select('_id firstName lastName email roles presenceStatus lastActiveAt')
      .lean();

    if (supportAgents.length === 0) {
      return null;
    }

    // Filter agents by their current presence status and activity
    const availableAgents: Array<SupportAgentResult & { presenceStatus: UserPresenceStatus }> = [];
    for (const agent of supportAgents) {
      // Calculate current presence status based on activity
      const currentPresence = calculatePresenceFromActivity(
        agent.lastActiveAt || DateUtils.now(),
        agent.presenceStatus,
      );

      // Check if agent is available for support
      if (isUserActiveForSupport(currentPresence)) {
        // Calculate active conversations for this agent
        const activeConversations = await this.conversationModel.countDocuments({
          assigned_support_agent: agent._id,
          is_active: true,
          support_status: { $in: ['open', 'pending'] },
        });

        availableAgents.push({
          _id: agent._id as Types.ObjectId,
          firstName: agent.firstName,
          lastName: agent.lastName,
          email: agent.email,
          roles: agent.roles || [],
          activeConversations,
          presenceStatus: currentPresence,
        });
      }
    }

    if (availableAgents.length === 0) {
      return null;
    }

    // Sort by active conversations (ascending) to get agent with least workload
    availableAgents.sort((a, b) => (a.activeConversations || 0) - (b.activeConversations || 0));

    // Return the agent with the least active conversations
    const selectedAgent = availableAgents[0];

    return {
      _id: selectedAgent._id,
      firstName: selectedAgent.firstName,
      lastName: selectedAgent.lastName,
      email: selectedAgent.email,
      roles: selectedAgent.roles,
      activeConversations: selectedAgent.activeConversations,
    } as SupportAgentResult;
  }

  private async formatConversationResponse(
    conversation: PopulatedConversation,
    userId: string,
  ): Promise<ConversationDataDto> {
    const unreadCount = await this.getConversationUnreadCount(String(conversation._id), userId);

    return {
      id: String(conversation._id),
      title: conversation.title,
      type: conversation.type || ConversationType.GENERAL,
      priority: conversation.priority || ConversationPriority.NORMAL,
      support_status: conversation.support_status,
      assigned_support_agent:
        conversation.assigned_support_agent &&
        this.isPopulatedUser(conversation.assigned_support_agent)
          ? this.transformUser(conversation.assigned_support_agent)
          : undefined,
      support_category: conversation.support_category,
      participants: conversation.participants
        .filter((p) => this.isPopulatedUser(p))
        .map((participant) => this.transformUser(participant as PopulatedUser)),
      booking_id: conversation.booking_id?.toString(),
      property_id: conversation.property_id?.toString(),
      last_message:
        conversation.last_message_id && this.isPopulatedMessage(conversation.last_message_id)
          ? await this.transformLastMessage(conversation.last_message_id)
          : undefined,
      last_activity: conversation.last_activity,
      is_active: conversation.is_active,
      unread_count: unreadCount,
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,
    };
  }

  private async formatMessageResponse(
    message: PopulatedMessage,
    userId: string,
  ): Promise<MessageDataDto> {
    const isRead = message.read_by?.some((receipt) => {
      const receiptUserId = this.isPopulatedUser(receipt.user_id)
        ? String(receipt.user_id._id)
        : String(receipt.user_id);
      return receiptUserId === userId;
    });

    // Decrypt message content for display
    const decryptedContent = this.isEncrypted(message.content)
      ? await this.decryptMessage(message.content)
      : message.content;

    const senderData = this.isPopulatedUser(message.sender_id)
      ? this.transformUser(message.sender_id)
      : {
          id: String(message.sender_id),
          firstName: '',
          lastName: '',
          avatarUrl: undefined,
          presenceStatus: UserPresenceStatus.OFFLINE,
          lastActivity: DateUtils.now(),
        };

    return {
      id: String(message._id),
      conversation_id: message.conversation_id.toString(),
      sender: senderData,
      content: decryptedContent,
      message_type: message.message_type,
      attachments: message.attachments || [],
      read_by: (message.read_by || []).map((receipt) => {
        if (this.isPopulatedUser(receipt.user_id)) {
          return {
            user: this.transformUser(receipt.user_id as PopulatedUser),
            read_at: receipt.read_at,
          };
        } else {
          return {
            user: {
              id: String(receipt.user_id),
              firstName: '',
              lastName: '',
              avatarUrl: undefined,
              presenceStatus: UserPresenceStatus.OFFLINE,
              lastActivity: DateUtils.now(),
            },
            read_at: receipt.read_at,
          };
        }
      }),
      is_deleted: message.is_deleted,
      reply_to: message.reply_to
        ? this.isPopulatedMessage(message.reply_to)
          ? await this.formatMessageResponseData(message.reply_to, userId)
          : undefined
        : undefined,
      is_read: isRead || false,
      createdAt: message.createdAt,
      updatedAt: message.updatedAt,
    };
  }

  private async formatMessageResponseData(
    message: PopulatedMessage,
    userId: string,
  ): Promise<MessageDataDto> {
    return await this.formatMessageResponse(message, userId);
  }

  // ================================================================================================
  // 5. ADMIN & STATISTICS METHODS
  // ================================================================================================

  async findAllConversationsAdmin(
    filters: ConversationFilters,
  ): Promise<PaginatedResult<ConversationDataDto>> {
    try {
      const { page: pageInput, limit: limitInput, search, type, status } = filters;
      const { page, limit, skip } = validatePagination({
        page: pageInput,
        limit: limitInput,
        maxLimit: 100,
      });

      // Build query with proper typing
      interface QueryFilter {
        type?: ConversationType;
        support_status?: string;
        $or?: Array<{ [key: string]: { $regex: string; $options: string } }>;
      }

      const query: QueryFilter = {};
      if (type) {
        query.type = type as ConversationType;
      }
      if (status) {
        query.support_status = status;
      }
      if (search) {
        query.$or = [
          { title: { $regex: search, $options: 'i' } },
          { support_category: { $regex: search, $options: 'i' } },
        ];
      }

      const [conversations, total] = await Promise.all([
        this.conversationModel
          .find(query)
          .populate({
            path: 'participants',
            select: 'firstName lastName email avatarUrl',
          })
          .populate({
            path: 'last_message_id',
            select: 'content createdAt sender_id message_type',
            populate: {
              path: 'sender_id',
              select: 'firstName lastName avatarUrl',
            },
          })
          .sort({ updatedAt: -1 })
          .skip(skip)
          .limit(limit)
          .exec(),
        this.conversationModel.countDocuments(query).exec(),
      ]);

      const transformedConversations = await Promise.all(
        conversations.map(async (conv) => {
          const convObj = conv.toObject() as PopulatedConversation;
          return await this.transformConversationForAdmin(convObj);
        }),
      );

      return buildPaginatedResult(transformedConversations, total, page, limit);
    } catch (error) {
      LoggingUtil.errorWithException(
        'Error fetching conversations for admin',
        error,
        'MessagingService',
      );
      throw new InternalServerErrorException('Failed to fetch conversations');
    }
  }

  /**
   * Type guard to check if a user is populated
   */
  private isPopulatedUser(
    user: PopulatedUser | Types.ObjectId | undefined | null,
  ): user is PopulatedUser {
    return Boolean(
      user &&
        typeof user === 'object' &&
        '_id' in user &&
        ('firstName' in user || 'lastName' in user || 'email' in user),
    );
  }

  /**
   * Type guard to check if a message is populated
   */
  private isPopulatedMessage(
    message: PopulatedMessage | Types.ObjectId | undefined | null,
  ): message is PopulatedMessage {
    return Boolean(
      message && typeof message === 'object' && '_id' in message && 'content' in message,
    );
  }

  // ================================================================================================
  // 6. DATA TRANSFORMATION METHODS
  // ================================================================================================

  /**
   * Transform any user document (populated or lean) to ConversationParticipantDto
   * Safely handles MongoDB's _id field regardless of its exact type
   */
  private transformUser(userInput: TransformableUser): ConversationParticipantDto {
    if (!userInput) {
      throw new Error('User data is required for transformation');
    }

    // Extract presence status safely
    const userPresenceStatus = userInput.presenceStatus as UserPresenceStatus;
    const currentPresenceStatus =
      userPresenceStatus && typeof userPresenceStatus === 'string' ? userPresenceStatus : undefined;

    // Calculate final presence status
    const finalPresenceStatus = currentPresenceStatus
      ? calculatePresenceFromActivity(
          userInput.lastActiveAt || DateUtils.now(),
          currentPresenceStatus,
        )
      : UserPresenceStatus.OFFLINE;

    // Handle _id conversion safely
    const userIdValue = userInput._id;
    const userId = userIdValue;

    return {
      id: userId as string,
      firstName: userInput.firstName || '',
      lastName: userInput.lastName || '',
      avatarUrl: userInput.avatarUrl || undefined,
      presenceStatus: finalPresenceStatus,
      lastActivity: userInput.lastActiveAt || DateUtils.now(),
    };
  }

  /**
   * Transform a PopulatedMessage to MessageDataDto
   */
  private async transformMessage(
    message: PopulatedMessage,
    currentUserId?: string,
  ): Promise<MessageDataDto> {
    // Transform sender - use sender for populated documents, sender_id for non-populated
    let sender: ConversationParticipantDto;
    const senderField = message.sender || message.sender_id;
    if (this.isPopulatedUser(senderField)) {
      sender = this.transformUser(senderField);
    } else {
      // Fallback - fetch user data if not populated
      const user = await this.userModel
        .findById(senderField)
        .select('firstName lastName email avatarUrl')
        .lean()
        .exec();

      if (user) {
        sender = this.transformUser(user);
      } else {
        sender = {
          id: String(senderField),
          firstName: 'Unknown',
          lastName: 'User',
          avatarUrl: undefined,
          presenceStatus: UserPresenceStatus.OFFLINE,
          lastActivity: DateUtils.now(),
        };
      }
    }

    // Decrypt message content
    let content = '';
    if (message.content) {
      try {
        if (typeof message.content === 'object') {
          content = 'Content decryption failed - invalid format';
        } else if (typeof message.content === 'string' && message.content.length > 0) {
          content = await this.decryptMessage(message.content);
        }
      } catch (error) {
        LoggingUtil.errorWithException(
          'Failed to decrypt message content',
          error,
          'MessagingService',
        );
        content = 'Decryption failed';
      }
    }

    // Transform read_by array to match MessageReadReceiptDto
    const read_by: MessageReadReceiptDto[] = [];
    if (message.read_by && Array.isArray(message.read_by)) {
      for (const readReceipt of message.read_by) {
        const userField = readReceipt.user || readReceipt.user_id;
        let user: ConversationParticipantDto;

        if (this.isPopulatedUser(userField)) {
          user = this.transformUser(userField);
        } else {
          // Fetch user data if not populated
          const userData = await this.userModel
            .findById(userField)
            .select('firstName lastName email avatarUrl')
            .lean()
            .exec();

          if (userData) {
            user = this.transformUser(userData);
          } else {
            user = {
              id: String(userField),
              firstName: 'Unknown',
              lastName: 'User',
              avatarUrl: undefined,
              presenceStatus: UserPresenceStatus.OFFLINE,
              lastActivity: DateUtils.now(),
            };
          }
        }

        read_by.push({
          user,
          read_at: readReceipt.read_at,
        });
      }
    }

    return {
      id: String(message._id),
      conversation_id: String(message.conversation_id),
      sender,
      content,
      message_type: message.message_type,
      attachments: message.attachments || [],
      read_by,
      is_deleted: message.is_deleted,
      reply_to: message.reply_to
        ? this.isPopulatedMessage(message.reply_to)
          ? await this.transformMessage(message.reply_to, currentUserId)
          : undefined
        : undefined,
      is_read: currentUserId ? this.isMessageReadByUser(message, currentUserId) : false,
      createdAt: message.createdAt,
      updatedAt: message.updatedAt,
    };
  }

  /**
   * Check if a message has been read by a specific user
   */
  private isMessageReadByUser(message: PopulatedMessage, userId: string): boolean {
    if (!message.read_by) return false;

    return message.read_by.some((receipt) => {
      // Handle both populated and non-populated read receipts
      const userField = receipt.user_id || (receipt as { user?: PopulatedUser }).user;
      return String(userField) === userId;
    });
  }

  /**
   * Helper method to transform last message object
   */
  private async transformLastMessage(lastMessage: PopulatedMessage): Promise<{
    id: string;
    sender: ConversationParticipantDto;
    content: string;
    message_type: MessageType;
    createdAt: Date;
  }> {
    // Decrypt message content
    let content = '';
    if (lastMessage.content) {
      try {
        if (typeof lastMessage.content === 'object') {
          content = 'Content decryption failed - invalid format';
        } else if (typeof lastMessage.content === 'string' && lastMessage.content.length > 0) {
          content = await this.decryptMessage(lastMessage.content);
        }
      } catch (error) {
        LoggingUtil.errorWithException(
          'Failed to decrypt last message content',
          error,
          'MessagingService',
        );
        content = 'Decryption failed';
      }
    }

    // Transform sender
    let sender: ConversationParticipantDto;
    if (this.isPopulatedUser(lastMessage.sender_id)) {
      sender = this.transformUser(lastMessage.sender_id);
    } else {
      // Fallback - fetch user data if not populated
      const user = await this.userModel
        .findById(lastMessage.sender_id)
        .select('firstName lastName email avatarUrl')
        .lean()
        .exec();

      if (user) {
        sender = this.transformUser(user);
      } else {
        sender = {
          id: String(lastMessage.sender_id),
          firstName: 'Unknown',
          lastName: 'User',
          avatarUrl: undefined,
          presenceStatus: UserPresenceStatus.OFFLINE,
          lastActivity: DateUtils.now(),
        };
      }
    }

    return {
      id: String(lastMessage._id),
      sender,
      content,
      message_type: lastMessage.message_type,
      createdAt: lastMessage.createdAt,
    };
  }

  /**
   * Helper method to populate participants manually
   */
  private async populateParticipants(
    participants: (PopulatedUser | Types.ObjectId)[],
  ): Promise<ConversationParticipantDto[]> {
    if (!Array.isArray(participants)) return [];

    const populatedParticipants = await Promise.all(
      participants.map(async (participant): Promise<ConversationParticipantDto | null> => {
        // If already populated, transform it
        if (this.isPopulatedUser(participant)) {
          return this.transformUser(participant);
        }

        // If it's an ObjectId, fetch the user data
        try {
          const user = await this.userModel
            .findById(participant)
            .select('firstName lastName email avatarUrl')
            .lean()
            .exec();

          return user ? this.transformUser(user) : null;
        } catch (error) {
          LoggingUtil.errorWithException(
            `Failed to populate participant ${String(participant)}`,
            error,
            'MessagingService',
          );
          return null;
        }
      }),
    );

    return populatedParticipants.filter((p): p is ConversationParticipantDto => p !== null);
  }

  /**
   * Helper method to transform conversation object for admin endpoints
   */
  private async transformConversationForAdmin(
    convObj: PopulatedConversation,
  ): Promise<ConversationDataDto> {
    // Transform participants
    const participants = await this.populateParticipants(convObj.participants);

    // Transform last message if present
    let last_message: ConversationDataDto['last_message'] = undefined;
    if (convObj.last_message_id && this.isPopulatedMessage(convObj.last_message_id)) {
      last_message = await this.transformLastMessage(convObj.last_message_id);
    }

    // Transform assigned support agent if present
    let assigned_support_agent: ConversationParticipantDto | undefined = undefined;
    if (convObj.assigned_support_agent && this.isPopulatedUser(convObj.assigned_support_agent)) {
      assigned_support_agent = this.transformUser(convObj.assigned_support_agent);
    }

    // Calculate total unread messages in conversation
    const unreadCount = await this.getConversationTotalUnreadCount(String(convObj._id));

    return {
      id: String(convObj._id),
      participants,
      booking_id: convObj.booking_id ? String(convObj.booking_id) : undefined,
      property_id: convObj.property_id ? String(convObj.property_id) : undefined,
      title: convObj.title,
      type: convObj.type,
      priority: convObj.priority,
      support_status: convObj.support_status,
      assigned_support_agent,
      support_category: convObj.support_category || undefined,
      last_message,
      last_activity: convObj.last_activity,
      is_active: convObj.is_active,
      unread_count: unreadCount,
      createdAt: convObj.createdAt,
      updatedAt: convObj.updatedAt,
    };
  }

  async findConversationByIdAdmin(id: string): Promise<ConversationDataDto> {
    ValidationUtils.validateObjectId(id, 'conversationId', {
      context: 'MessagingService',
      customMessage: 'Invalid conversation ID format',
    });

    try {
      const conversation = await this.conversationModel
        .findById(id)
        .populate({
          path: 'participants',
          select: 'firstName lastName email avatarUrl',
        })
        .populate({
          path: 'last_message_id',
          select: 'content createdAt sender_id message_type',
          populate: {
            path: 'sender_id',
            select: 'firstName lastName avatarUrl',
          },
        })
        .exec();

      if (!conversation) {
        throw new NotFoundException('Conversation not found');
      }

      const convObj = conversation.toObject() as PopulatedConversation;
      return await this.transformConversationForAdmin(convObj);
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      LoggingUtil.errorWithException(
        `Error fetching conversation ${id} for admin`,
        error,
        'MessagingService',
      );
      throw new InternalServerErrorException('Failed to fetch conversation');
    }
  }

  async getMessagesAdmin(
    conversationId: string,
    filters: MessageFilters,
  ): Promise<PaginatedResult<MessageDataDto>> {
    ValidationUtils.validateObjectId(conversationId, 'conversationId', {
      context: 'MessagingService',
      customMessage: 'Invalid conversation ID format',
    });

    try {
      const { page: pageInput, limit: limitInput, fromDate, toDate } = filters;
      const { page, limit, skip } = validatePagination({
        page: pageInput,
        limit: limitInput,
        maxLimit: 100,
      });

      // Build query with proper typing
      interface MessageQuery {
        conversation_id: Types.ObjectId;
        is_deleted: boolean;
        createdAt?: {
          $gte?: Date;
          $lte?: Date;
        };
      }

      const query: MessageQuery = {
        conversation_id: new Types.ObjectId(conversationId),
        is_deleted: false,
      };

      if (fromDate || toDate) {
        query.createdAt = {};
        if (fromDate) {
          query.createdAt.$gte = DateUtils.create(fromDate);
        }
        if (toDate) {
          query.createdAt.$lte = DateUtils.create(toDate);
        }
      }

      const [messages, total] = await Promise.all([
        this.messageModel
          .find(query)
          .populate({
            path: 'sender_id',
            select: 'firstName lastName email avatarUrl',
          })
          .sort({ createdAt: 1 })
          .skip(skip)
          .limit(limit)
          .exec(),
        this.messageModel.countDocuments(query).exec(),
      ]);

      const transformedMessages = await Promise.all(
        messages.map(async (msg) => {
          const messageObj = msg.toObject() as PopulatedMessage;
          return await this.transformMessage(messageObj);
        }),
      );

      return buildPaginatedResult(transformedMessages, total, page, limit);
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      LoggingUtil.errorWithException(
        `Error fetching messages for conversation ${conversationId}`,
        error,
        'MessagingService',
      );
      throw new InternalServerErrorException('Failed to fetch messages');
    }
  }

  async deleteConversationAdmin(conversationId: string, adminUserId: string): Promise<void> {
    ValidationUtils.validateObjectId(conversationId, 'conversationId', {
      context: 'MessagingService',
      customMessage: 'Invalid conversation ID format',
    });

    try {
      // Delete all messages in the conversation
      await this.messageModel.deleteMany({ conversation_id: conversationId }).exec();

      // Delete the conversation
      const result = await this.conversationModel.findByIdAndDelete(conversationId).exec();

      if (!result) {
        throw new NotFoundException('Conversation not found');
      }

      LoggingUtil.log(
        `Conversation ${conversationId} deleted by admin ${adminUserId}`,
        'MessagingService',
      );
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      LoggingUtil.errorWithException(
        `Error deleting conversation ${conversationId}`,
        error,
        'MessagingService',
      );
      throw new InternalServerErrorException('Failed to delete conversation');
    }
  }

  async deleteMessageAdmin(messageId: string, adminUserId: string): Promise<void> {
    ValidationUtils.validateObjectId(messageId, 'messageId', {
      context: 'MessagingService',
      customMessage: 'Invalid message ID format',
    });

    try {
      const result = await this.messageModel.findByIdAndDelete(messageId).exec();

      if (!result) {
        throw new NotFoundException('Message not found');
      }

      LoggingUtil.log(`Message ${messageId} deleted by admin ${adminUserId}`, 'MessagingService');
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      LoggingUtil.errorWithException(
        `Error deleting message ${messageId}`,
        error,
        'MessagingService',
      );
      throw new InternalServerErrorException('Failed to delete message');
    }
  }

  async flagMessageAdmin(
    messageId: string,
    adminUserId: string,
    reason: string,
  ): Promise<MessageDocument> {
    ValidationUtils.validateObjectId(messageId, 'messageId', {
      context: 'MessagingService',
      customMessage: 'Invalid message ID format',
    });

    try {
      const message = await this.messageModel.findById(messageId).exec();

      if (!message) {
        throw new NotFoundException('Message not found');
      }

      // Add flagged status and reason
      const updatedMessage = await this.messageModel
        .findByIdAndUpdate(
          messageId,
          {
            flagged: true,
            flagReason: reason,
            flaggedBy: adminUserId,
            flaggedAt: DateUtils.now(),
          },
          { new: true },
        )
        .exec();

      LoggingUtil.log(
        `Message ${messageId} flagged by admin ${adminUserId} with reason: ${reason}`,
        'MessagingService',
      );

      return updatedMessage!;
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      LoggingUtil.errorWithException(
        `Error flagging message ${messageId}`,
        error,
        'MessagingService',
      );
      throw new InternalServerErrorException('Failed to flag message');
    }
  }

  async getStatisticsAdmin(filters: DateRangeFilter): Promise<MessagingStats> {
    try {
      const { from, to } = filters;

      // Build date filter
      const dateFilter: DateFilter = {};
      if (from || to) {
        dateFilter.createdAt = {};
        if (from) {
          dateFilter.createdAt.$gte = DateUtils.create(from);
        }
        if (to) {
          dateFilter.createdAt.$lte = DateUtils.create(to);
        }
      }

      // Get message statistics
      const messageStats = await this.messageModel
        .aggregate<MessageStatsResult>([
          { $match: dateFilter },
          {
            $group: {
              _id: null,
              totalMessages: { $sum: 1 },
              averageMessageLength: { $avg: { $strLenCP: '$content' } },
            },
          },
        ])
        .exec();

      // Get conversation statistics
      const conversationStats = await this.conversationModel
        .aggregate<ConversationStatsResult>([
          { $match: dateFilter },
          {
            $group: {
              _id: '$type',
              count: { $sum: 1 },
            },
          },
        ])
        .exec();

      const conversationsByType = conversationStats.reduce((acc: Record<string, number>, item) => {
        acc[String(item._id)] = item.count;
        return acc;
      }, {});

      const result = messageStats[0];
      return {
        totalMessages: result?.totalMessages || 0,
        averageMessageLength: Math.round(result?.averageMessageLength || 0),
        conversationsByType,
        dateRange: { from, to },
      };
    } catch (error) {
      LoggingUtil.errorWithException(
        'Error fetching messaging statistics',
        error,
        'MessagingService',
      );
      throw new InternalServerErrorException('Failed to fetch messaging statistics');
    }
  }

  async getSupportConversationsAdmin(
    filters: ConversationFilters,
  ): Promise<PaginatedResult<ConversationDataDto>> {
    try {
      const { page: pageInput, limit: limitInput, status } = filters;
      const { page, limit, skip } = validatePagination({
        page: pageInput,
        limit: limitInput,
        maxLimit: 100,
      });

      // Build query for support conversations
      interface QueryFilter {
        type: { $in: ConversationType[] };
        support_status?: string;
      }

      const query: QueryFilter = {
        type: {
          $in: [ConversationType.SUPPORT_GUEST, ConversationType.SUPPORT_HOST],
        },
      };
      if (status) {
        query.support_status = status;
      }

      const [conversations, total] = await Promise.all([
        this.conversationModel
          .find(query)
          .populate({
            path: 'participants',
            select: 'firstName lastName email avatarUrl',
          })
          .populate({
            path: 'last_message_id',
            select: 'content createdAt sender_id message_type',
            populate: {
              path: 'sender_id',
              select: 'firstName lastName avatarUrl',
            },
          })
          .sort({ updatedAt: -1 })
          .skip(skip)
          .limit(limit)
          .exec(),
        this.conversationModel.countDocuments(query).exec(),
      ]);

      const transformedConversations = await Promise.all(
        conversations.map(async (conv) => {
          const convObj = conv.toObject() as PopulatedConversation;
          return await this.transformConversationForAdmin(convObj);
        }),
      );

      return buildPaginatedResult(transformedConversations, total, page, limit);
    } catch (error) {
      LoggingUtil.errorWithException(
        'Error fetching support conversations for admin',
        error,
        'MessagingService',
      );
      throw new InternalServerErrorException('Failed to fetch support conversations');
    }
  }

  // Alias method for compatibility
  async getUserConversations(
    userId: string,
    filters: {
      page: number;
      limit: number;
      type?: string;
    },
  ): Promise<{
    data: ConversationDataDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  }> {
    const result = await this.getConversations(
      userId,
      { page: filters.page, limit: filters.limit },
      filters.type as ConversationType,
    );

    return {
      data: result.conversations,
      total: result.pagination.total,
      page: result.pagination.page,
      limit: result.pagination.limit,
      totalPages: result.pagination.pages,
      hasNextPage: result.pagination.hasNext,
      hasPrevPage: result.pagination.hasPrev,
    };
  }
}
