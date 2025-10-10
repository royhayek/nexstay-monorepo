import { ApiProperty } from '@nestjs/swagger';
import {
  ConversationType,
  ConversationPriority,
} from '../../../database/schemas/conversation.schema';
import {
  IsUuidArrayField,
  IsNameField,
  IsUuidField,
  IsEnumField,
} from '../../../common/validators/standardized-validators';

export class CreateConversationDto {
  @IsUuidArrayField({
    required: true,
    description: 'Array of participant user IDs',
    example: ['60d5f484f0d4a6001f4e8b5a', '60d5f484f0d4a6001f4e8b5b'],
    minItems: 2,
    maxItems: 10,
  })
  participants: string[];

  @IsNameField({
    required: true,
    description: 'Title of the conversation',
    example: 'Booking inquiry for Downtown Apartment',
    minLength: 3,
    maxLength: 100,
  })
  title: string;

  @IsUuidField({
    description: 'Associated booking ID',
    example: '60d5f484f0d4a6001f4e8b5c',
  })
  booking_id?: string;

  @IsUuidField({
    description: 'Associated property ID',
    example: '60d5f484f0d4a6001f4e8b5d',
  })
  property_id?: string;

  @IsEnumField(ConversationType, {
    description: 'Type of conversation',
    example: ConversationType.BOOKING,
  })
  type?: ConversationType;

  @IsEnumField(ConversationPriority, {
    description: 'Priority level for support conversations',
    example: ConversationPriority.NORMAL,
  })
  priority?: ConversationPriority;

  @IsNameField({
    description: 'Support category for support conversations',
    example: 'technical_issue',
  })
  support_category?: string;

  @ApiProperty({
    description: 'Additional metadata for the conversation',
    example: { source: 'booking_inquiry', priority: 'normal' },
    required: false,
  })
  metadata?: Record<string, any>;
}
