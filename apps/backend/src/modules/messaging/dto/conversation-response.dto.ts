import { ApiProperty } from '@nestjs/swagger';
import { MessageType } from '../../../database/schemas/message.schema';
import {
  ConversationType,
  ConversationPriority,
  SupportTicketStatus,
} from '../../../database/schemas/conversation.schema';
import { Expose, Transform, Type } from 'class-transformer';

import { BaseResponseDto } from '../../../common/dto/base-response.dto';
import { PaginatedDto } from '../../../common/dto/paginated.dto';
import { UserPresenceStatus } from '../../../common/enums/user-presence.enums';
import { Types } from 'mongoose';

export class ConversationParticipantDto {
  @ApiProperty({
    description: 'User ID',
    example: '60d5f484f0d4a6001f4e8b5a',
  })
  @Expose()
  @Transform(({ obj }: { obj: { _id: Types.ObjectId } }) => obj._id.toString())
  id!: string;

  @ApiProperty({
    description: 'User first name',
    example: 'John',
  })
  firstName: string;

  @ApiProperty({
    description: 'User last name',
    example: 'Doe',
  })
  lastName: string;

  @ApiProperty({
    description: 'User avatar image URL',
    example: 'https://s3.amazonaws.com/bucket/profiles/user.jpg',
    required: false,
  })
  avatarUrl?: string;

  @ApiProperty({
    description: 'User presence status',
    enum: UserPresenceStatus,
    example: UserPresenceStatus.AVAILABLE,
  })
  presenceStatus: UserPresenceStatus;

  @ApiProperty({
    description: 'User last activity timestamp',
    example: '2024-08-17T10:30:00.000Z',
  })
  lastActivity: Date;
}

export class LastMessageDto {
  @ApiProperty({
    description: 'Message ID',
    example: '60d5f484f0d4a6001f4e8b5e',
  })
  id: string;

  @ApiProperty({
    description: 'Message content',
    example: 'Looking forward to your stay!',
  })
  content: string;

  @ApiProperty({
    description: 'Message type',
    enum: MessageType,
    example: MessageType.TEXT,
  })
  message_type: MessageType;

  @ApiProperty({
    description: 'Sender information',
    type: ConversationParticipantDto,
  })
  sender: ConversationParticipantDto;

  @ApiProperty({
    description: 'Message timestamp',
    example: '2024-08-17T10:30:00.000Z',
  })
  createdAt: Date;
}

export class ConversationDataDto {
  @ApiProperty({
    description: 'Conversation ID',
    example: '60d5f484f0d4a6001f4e8b5c',
  })
  id: string;

  @ApiProperty({
    description: 'Conversation title',
    example: 'Booking inquiry for Downtown Apartment',
  })
  title: string;

  @ApiProperty({
    description: 'Conversation participants',
    type: [ConversationParticipantDto],
  })
  participants: ConversationParticipantDto[];

  @ApiProperty({
    description: 'Associated booking ID',
    example: '60d5f484f0d4a6001f4e8b5d',
    required: false,
  })
  booking_id?: string;

  @ApiProperty({
    description: 'Associated property ID',
    example: '60d5f484f0d4a6001f4e8b5e',
    required: false,
  })
  property_id?: string;

  @ApiProperty({
    description: 'Type of conversation',
    enum: ConversationType,
    example: ConversationType.BOOKING,
  })
  type: ConversationType;

  @ApiProperty({
    description: 'Priority level',
    enum: ConversationPriority,
    example: ConversationPriority.NORMAL,
  })
  priority: ConversationPriority;

  @ApiProperty({
    description: 'Support ticket status (for support conversations)',
    enum: SupportTicketStatus,
    required: false,
  })
  support_status?: SupportTicketStatus;

  @ApiProperty({
    description: 'Assigned support agent information',
    type: ConversationParticipantDto,
    required: false,
  })
  assigned_support_agent?: ConversationParticipantDto;

  @ApiProperty({
    description: 'Support category',
    example: 'technical_issue',
    required: false,
  })
  support_category?: string;

  @ApiProperty({
    description: 'Last message in the conversation',
    type: LastMessageDto,
    required: false,
  })
  last_message?: LastMessageDto;

  @ApiProperty({
    description: 'Last activity timestamp',
    example: '2024-08-17T10:30:00.000Z',
  })
  last_activity: Date;

  @ApiProperty({
    description: 'Whether the conversation is active',
    example: true,
  })
  is_active: boolean;

  @ApiProperty({
    description: 'Unread message count for the current user',
    example: 3,
  })
  unread_count: number;

  @ApiProperty({
    description: 'Conversation creation timestamp',
    example: '2024-08-17T09:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Conversation last update timestamp',
    example: '2024-08-17T10:30:00.000Z',
  })
  updatedAt: Date;
}

export class ConversationResponseDto extends BaseResponseDto<ConversationDataDto> {
  @ApiProperty({
    description: 'Conversation data',
    type: ConversationDataDto,
  })
  declare data: ConversationDataDto;
}

// Standardized paginated conversations using PaginatedDto
export class ConversationsPaginatedDto extends PaginatedDto<ConversationDataDto> {
  @ApiProperty({ type: [ConversationDataDto], description: 'Array of conversation items' })
  @Type(() => ConversationDataDto)
  declare items: ConversationDataDto[];
}

export class ConversationListResponseDto extends BaseResponseDto<ConversationsPaginatedDto> {
  @ApiProperty({
    description: 'Paginated conversations list data',
    type: ConversationsPaginatedDto,
  })
  declare data: ConversationsPaginatedDto;
}
