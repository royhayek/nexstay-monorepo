import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString, IsOptional, Min, Max } from 'class-validator';
import { IsIdentifierField, IsTextAreaField } from '../../../common/validators/standardized-validators';

/**
 * DTO for issuing refunds by support staff
 * Includes permission boundary validation for support role ($500 limit)
 */
export class IssueRefundDto {
  @IsIdentifierField({
    required: true,
    description: 'Booking ID to refund',
    example: '507f1f77bcf86cd799439011',
  })
  bookingId: string;

  @ApiProperty({
    description: 'Refund amount in the booking currency',
    example: 350.50,
    minimum: 0.01,
    maximum: 10000,
    required: true,
  })
  @IsNotEmpty({ message: 'Refund amount is required' })
  @IsNumber({}, { message: 'Refund amount must be a number' })
  @Min(0.01, { message: 'Refund amount must be at least 0.01' })
  @Max(10000, { message: 'Refund amount cannot exceed 10,000' })
  amount: number;

  @IsTextAreaField({
    required: true,
    description: 'Reason for the refund (for audit trail)',
    example: 'Guest reported property issues - maintenance failure, approved refund after review',
    minLength: 10,
    maxLength: 500,
  })
  reason: string;

  @ApiProperty({
    description: 'Internal notes (not visible to customer)',
    example: 'Manager approved via ticket #12345. Host contacted and acknowledged issue.',
    required: false,
    minLength: 5,
    maxLength: 1000,
  })
  @IsOptional()
  @IsString({ message: 'Internal notes must be a string' })
  internalNotes?: string;

  @ApiProperty({
    description: 'Support ticket/conversation ID associated with this refund',
    example: '507f191e810c19729de860ea',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Support ticket ID must be a string' })
  supportTicketId?: string;
}

/**
 * DTO for refund approval request (for amounts exceeding support limit)
 */
export class RequestRefundApprovalDto extends IssueRefundDto {
  @ApiProperty({
    description: 'Admin user ID to request approval from',
    example: '507f191e810c19729de860ea',
    required: false,
  })
  @IsOptional()
  @IsString()
  approverUserId?: string;

  @IsTextAreaField({
    required: true,
    description: 'Justification for exceeding support refund limit',
    example: 'Critical property safety issue reported by guest. Host unresponsive. Guest threatened legal action. Requires immediate resolution.',
    minLength: 20,
    maxLength: 1000,
  })
  approvalJustification: string;
}
