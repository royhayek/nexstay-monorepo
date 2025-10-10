import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsObject } from 'class-validator';
import {
  VerificationStatus,
  VerificationRejectionReason,
} from '../../../database/schemas/identity-verification.schema';
import { IsEnumField, IsTextAreaField } from '../../../common/validators/standardized-validators';

export class UpdateVerificationStatusDto {
  @IsEnumField(VerificationStatus, { required: true, example: VerificationStatus.APPROVED })
  status!: VerificationStatus;

  @IsEnumField(VerificationRejectionReason, {
    required: false,
    example: VerificationRejectionReason.DOCUMENT_UNCLEAR,
  })
  rejectionReason?: VerificationRejectionReason;

  @IsTextAreaField({ required: false, maxLength: 500, example: 'Document verified successfully' })
  comment?: string;

  @ApiPropertyOptional({
    description: 'Additional metadata for the status change',
    type: 'object',
    additionalProperties: true,
  })
  @IsObject()
  metadata?: Record<string, any>;
}
