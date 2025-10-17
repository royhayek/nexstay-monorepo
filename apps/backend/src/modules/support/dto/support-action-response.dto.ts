import { ApiProperty } from '@nestjs/swagger';
import { createResponseDto } from '../../../common/dto/base-response.dto';

/**
 * Refund result details
 */
export class RefundResultDto {
  @ApiProperty({
    description: 'Booking ID that was refunded',
    example: '507f1f77bcf86cd799439011',
  })
  bookingId: string;

  @ApiProperty({
    description: 'Refund amount issued',
    example: 350.50,
  })
  refundAmount: number;

  @ApiProperty({
    description: 'Currency of the refund',
    example: 'USD',
  })
  currency: string;

  @ApiProperty({
    description: 'Transaction/refund ID from payment provider',
    example: 'refund_1a2b3c4d5e6f',
    required: false,
  })
  transactionId?: string;

  @ApiProperty({
    description: 'Reason for the refund',
    example: 'Guest reported property issues - maintenance failure',
  })
  reason: string;

  @ApiProperty({
    description: 'Date when refund was processed',
    example: '2024-10-12T14:30:00Z',
  })
  refundDate: Date;

  @ApiProperty({
    description: 'Support agent who issued the refund',
    example: '507f191e810c19729de860ea',
  })
  issuedBy: string;

  @ApiProperty({
    description: 'Whether this refund required admin approval (exceeded $500 limit)',
    example: false,
  })
  requiredApproval: boolean;

  @ApiProperty({
    description: 'Approver user ID if approval was required',
    example: '507f191e810c19729de860ea',
    required: false,
  })
  approvedBy?: string;
}

/**
 * Response for successful refund operation
 */
export const RefundResponseDto = createResponseDto(RefundResultDto);
export type RefundResponseDto = InstanceType<typeof RefundResponseDto>;

/**
 * Approval request result
 */
export class ApprovalRequestResultDto {
  @ApiProperty({
    description: 'Approval request ID',
    example: '507f191e810c19729de860ea',
  })
  requestId: string;

  @ApiProperty({
    description: 'Status of the approval request',
    example: 'pending_approval',
    enum: ['pending_approval', 'approved', 'rejected'],
  })
  status: 'pending_approval' | 'approved' | 'rejected';

  @ApiProperty({
    description: 'Requested refund amount',
    example: 750.00,
  })
  requestedAmount: number;

  @ApiProperty({
    description: 'Booking ID associated with the request',
    example: '507f1f77bcf86cd799439011',
  })
  bookingId: string;

  @ApiProperty({
    description: 'User ID who requested approval',
    example: '507f191e810c19729de860ea',
  })
  requestedBy: string;

  @ApiProperty({
    description: 'Timestamp when request was created',
    example: '2024-10-12T14:30:00Z',
  })
  requestedAt: Date;

  @ApiProperty({
    description: 'Assigned approver user ID',
    example: '507f191e810c19729de860ea',
    required: false,
  })
  assignedTo?: string;
}

/**
 * Response for refund approval request
 */
export const ApprovalRequestResponseDto = createResponseDto(ApprovalRequestResultDto);
export type ApprovalRequestResponseDto = InstanceType<typeof ApprovalRequestResponseDto>;

/**
 * Support ticket assignment result
 */
export class TicketAssignmentResultDto {
  @ApiProperty({
    description: 'Conversation/ticket ID that was assigned',
    example: '507f191e810c19729de860ea',
  })
  conversationId: string;

  @ApiProperty({
    description: 'Support agent user ID assigned to ticket',
    example: '507f191e810c19729de860ea',
  })
  assignedTo: string;

  @ApiProperty({
    description: 'Assigned agent name',
    example: 'John Smith',
  })
  assignedAgentName: string;

  @ApiProperty({
    description: 'Ticket priority level',
    example: 'high',
    enum: ['low', 'normal', 'high', 'urgent'],
  })
  priority: string;

  @ApiProperty({
    description: 'Assignment timestamp',
    example: '2024-10-12T14:30:00Z',
  })
  assignedAt: Date;
}

/**
 * Response for ticket assignment
 */
export const TicketAssignmentResponseDto = createResponseDto(TicketAssignmentResultDto);
export type TicketAssignmentResponseDto = InstanceType<typeof TicketAssignmentResponseDto>;

/**
 * Support statistics result
 */
export class SupportStatsResultDto {
  @ApiProperty({
    description: 'Total active support tickets',
    example: 42,
  })
  activeTickets: number;

  @ApiProperty({
    description: 'Tickets assigned to current support agent',
    example: 8,
  })
  assignedToMe: number;

  @ApiProperty({
    description: 'Tickets pending user response',
    example: 15,
  })
  pendingUser: number;

  @ApiProperty({
    description: 'Urgent priority tickets',
    example: 3,
  })
  urgentTickets: number;

  @ApiProperty({
    description: 'Total refunds issued this month',
    example: 12,
  })
  refundsIssuedThisMonth: number;

  @ApiProperty({
    description: 'Total refund amount issued this month',
    example: 3450.75,
  })
  refundAmountThisMonth: number;

  @ApiProperty({
    description: 'Average resolution time in hours',
    example: 4.5,
  })
  averageResolutionTimeHours: number;
}

/**
 * Response for support statistics
 */
export const SupportStatsResponseDto = createResponseDto(SupportStatsResultDto);
export type SupportStatsResponseDto = InstanceType<typeof SupportStatsResponseDto>;
