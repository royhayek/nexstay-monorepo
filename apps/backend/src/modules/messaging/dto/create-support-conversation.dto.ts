import { ApiProperty } from '@nestjs/swagger';
import {
  ConversationPriority,
  ConversationType,
} from '../../../database/schemas/conversation.schema';
import {
  IsNameField,
  IsEnumField,
  IsTextAreaField,
} from '../../../common/validators/standardized-validators';

export class CreateSupportConversationDto {
  @IsNameField({
    required: true,
    description: 'Title of the support conversation',
    example: 'Unable to complete booking payment',
    minLength: 5,
    maxLength: 100,
  })
  title: string;

  @IsEnumField([ConversationType.SUPPORT_GUEST, ConversationType.SUPPORT_HOST], {
    required: true,
    description: 'Type of support conversation',
    example: ConversationType.SUPPORT_GUEST,
  })
  type: ConversationType.SUPPORT_GUEST | ConversationType.SUPPORT_HOST;

  @IsEnumField(ConversationPriority, {
    description: 'Priority level for the support ticket',
    example: ConversationPriority.NORMAL,
  })
  priority?: ConversationPriority;

  @IsNameField({
    description: 'Support category',
    example: 'payment_issue',
  })
  support_category?: string;

  @IsTextAreaField({
    required: true,
    description: 'Initial message content',
    example:
      'I am having trouble completing my payment for booking #12345. The page keeps showing an error.',
    minLength: 10,
    maxLength: 2000,
  })
  initial_message: string;

  @ApiProperty({
    description: 'Additional metadata for the support ticket',
    example: {
      booking_id: '60d5f484f0d4a6001f4e8b5c',
      error_code: 'PAYMENT_FAILED',
      browser: 'Chrome 120.0',
    },
    required: false,
  })
  metadata?: Record<string, any>;
}
