import { ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { MessageType } from '../../../database/schemas/message.schema';
import {
  IsUrlField,
  IsNameField,
  IsTextAreaField,
  IsEnumField,
  IsUuidField,
  IsNumberField,
} from '../../../common/validators/standardized-validators';
import { ApiProperty } from '@nestjs/swagger';

export class MessageAttachmentDto {
  @IsUrlField({
    required: true,
    description: 'URL of the attachment',
    example: 'https://s3.amazonaws.com/bucket/attachments/file.jpg',
  })
  url: string;

  @IsNameField({
    required: true,
    description: 'Original filename',
    example: 'property_photo.jpg',
  })
  filename: string;

  @IsNameField({
    required: true,
    description: 'MIME type of the file',
    example: 'image/jpeg',
  })
  mimetype: string;

  @IsNumberField({
    required: true,
    description: 'File size in bytes',
    example: 1024000,
    minValue: 1,
    maxValue: 50 * 1024 * 1024, // 50MB max
  })
  size: number;
}

export class SendMessageDto {
  @IsTextAreaField({
    required: true,
    description: 'Message content',
    example: 'Hello! I would like to book your property for next weekend.',
    minLength: 1,
    maxLength: 2000,
  })
  content: string;

  @IsEnumField(MessageType, {
    description: 'Type of message',
    example: MessageType.TEXT,
  })
  message_type?: MessageType;

  @ApiProperty({
    description: 'Array of file attachments',
    type: [MessageAttachmentDto],
    required: false,
  })
  @ValidateNested({ each: true })
  @Type(() => MessageAttachmentDto)
  attachments?: MessageAttachmentDto[];

  @IsUuidField({
    description: 'ID of the message being replied to',
    example: '60d5f484f0d4a6001f4e8b5e',
  })
  reply_to?: string;

  @ApiProperty({
    description: 'Additional metadata for the message',
    example: { priority: 'high', category: 'urgent' },
    required: false,
  })
  metadata?: Record<string, any>;
}
