import { ApiProperty } from '@nestjs/swagger';
import { MessageType } from '../../../database/schemas/message.schema';
import { ConversationParticipantDto } from './conversation-response.dto';
import { BaseResponseDto } from '../../../common/dto/base-response.dto';
import { PaginatedDto } from '../../../common/dto/paginated.dto';
import { Type } from 'class-transformer';

export class MessageAttachmentResponseDto {
  @ApiProperty({
    description: 'Attachment URL',
    example: 'https://s3.amazonaws.com/bucket/attachments/file.jpg',
  })
  url: string;

  @ApiProperty({
    description: 'Original filename',
    example: 'property_photo.jpg',
  })
  filename: string;

  @ApiProperty({
    description: 'MIME type',
    example: 'image/jpeg',
  })
  mimetype: string;

  @ApiProperty({
    description: 'File size in bytes',
    example: 1024000,
  })
  size: number;
}

export class MessageReadReceiptDto {
  @ApiProperty({
    description: 'User who read the message',
    type: ConversationParticipantDto,
  })
  user: ConversationParticipantDto;

  @ApiProperty({
    description: 'When the message was read',
    example: '2024-08-17T10:35:00.000Z',
  })
  read_at: Date;
}

export class MessageDataDto {
  @ApiProperty({
    description: 'Message ID',
    example: '60d5f484f0d4a6001f4e8b5e',
  })
  id: string;

  @ApiProperty({
    description: 'Conversation ID',
    example: '60d5f484f0d4a6001f4e8b5c',
  })
  conversation_id: string;

  @ApiProperty({
    description: 'Message sender information',
    type: ConversationParticipantDto,
  })
  sender: ConversationParticipantDto;

  @ApiProperty({
    description: 'Message content',
    example: 'Hello! I would like to book your property for next weekend.',
  })
  content: string;

  @ApiProperty({
    description: 'Message type',
    enum: MessageType,
    example: MessageType.TEXT,
  })
  message_type: MessageType;

  @ApiProperty({
    description: 'Message attachments',
    type: [MessageAttachmentResponseDto],
  })
  attachments: MessageAttachmentResponseDto[];

  @ApiProperty({
    description: 'Read receipts for this message',
    type: [MessageReadReceiptDto],
  })
  read_by: MessageReadReceiptDto[];

  @ApiProperty({
    description: 'Whether the message is deleted',
    example: false,
  })
  is_deleted: boolean;

  @ApiProperty({
    description: 'Message being replied to',
    type: () => MessageDataDto,
    required: false,
  })
  reply_to?: MessageDataDto;

  @ApiProperty({
    description: 'Whether current user has read this message',
    example: true,
  })
  is_read: boolean;

  @ApiProperty({
    description: 'Message creation timestamp',
    example: '2024-08-17T10:30:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Message last update timestamp',
    example: '2024-08-17T10:30:00.000Z',
  })
  updatedAt: Date;
}

export class MessageResponseDto extends BaseResponseDto<MessageDataDto> {
  @ApiProperty({
    description: 'Message data',
    type: MessageDataDto,
  })
  declare data: MessageDataDto;
}

// Standardized paginated messages using PaginatedDto
export class MessagesPaginatedDto extends PaginatedDto<MessageDataDto> {
  @ApiProperty({ type: [MessageDataDto], description: 'Array of message items' })
  @Type(() => MessageDataDto)
  declare items: MessageDataDto[];
}

export class MessageListResponseDto extends BaseResponseDto<MessagesPaginatedDto> {
  @ApiProperty({
    description: 'Paginated messages list data',
    type: MessagesPaginatedDto,
  })
  declare data: MessagesPaginatedDto;
}
