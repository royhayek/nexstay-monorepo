import { ApiProperty } from '@nestjs/swagger';
import { BaseResponseDto } from '../../../common/dto/base-response.dto';
import { ConversationDataDto } from './conversation-response.dto';
import { MessageDataDto } from './message-response.dto';

/**
 * Data DTOs for messaging operations
 */

export class MessageDeletionDataDto {
  @ApiProperty({ description: 'Deletion success status', example: true })
  deleted: boolean;
}

export class MessagingStatsDataDto {
  @ApiProperty({ description: 'Total number of messages', example: 5000 })
  totalMessages: number;

  @ApiProperty({ description: 'Average message length in characters', example: 125.5 })
  averageMessageLength: number;

  @ApiProperty({
    description: 'Message count by conversation type',
    example: { booking: 300, support: 150, general: 50 },
  })
  conversationsByType: Record<string, number>;

  @ApiProperty({
    description: 'Date range for statistics',
    example: { from: '2024-01-01', to: '2024-01-31' },
  })
  dateRange: {
    from?: string;
    to?: string;
  };
}

export class FlaggedMessageDataDto {
  @ApiProperty({ description: 'Message ID', example: '60d5f484f0d4a6001f4e8b5e' })
  id: string;

  @ApiProperty({ description: 'Whether message is flagged', example: true })
  flagged: boolean;

  @ApiProperty({
    description: 'Reason for flagging',
    example: 'Inappropriate content',
    required: false,
  })
  reason?: string;
}

export class ReadStatusDataDto {
  @ApiProperty({ description: 'Whether messages were marked as read', example: true })
  markedAsRead: boolean;

  @ApiProperty({ description: 'Updated unread count', example: 5 })
  unreadCount: number;
}

export class UnreadCountDataDto {
  @ApiProperty({ description: 'Total unread messages count', example: 12 })
  count: number;
}

/**
 * Response DTOs for messaging operations
 */

// Single conversation response
export class ConversationResponseDto extends BaseResponseDto<ConversationDataDto> {
  @ApiProperty({ type: ConversationDataDto })
  declare data: ConversationDataDto;
}

// Single message response
export class SingleMessageResponseDto extends BaseResponseDto<MessageDataDto> {
  @ApiProperty({ type: MessageDataDto })
  declare data: MessageDataDto;
}

// Message deletion response
export class MessageDeletionResponseDto extends BaseResponseDto<MessageDeletionDataDto> {
  @ApiProperty({ type: MessageDeletionDataDto })
  declare data: MessageDeletionDataDto;
}

// Messaging statistics response
export class MessagingStatsResponseDto extends BaseResponseDto<MessagingStatsDataDto> {
  @ApiProperty({ type: MessagingStatsDataDto })
  declare data: MessagingStatsDataDto;
}

// Flagged message response
export class FlaggedMessageResponseDto extends BaseResponseDto<FlaggedMessageDataDto> {
  @ApiProperty({ type: FlaggedMessageDataDto })
  declare data: FlaggedMessageDataDto;
}

// Read status response
export class ReadStatusResponseDto extends BaseResponseDto<ReadStatusDataDto> {
  @ApiProperty({ type: ReadStatusDataDto })
  declare data: ReadStatusDataDto;
}

// Unread count response
export class UnreadCountResponseDto extends BaseResponseDto<UnreadCountDataDto> {
  @ApiProperty({ type: UnreadCountDataDto })
  declare data: UnreadCountDataDto;
}
