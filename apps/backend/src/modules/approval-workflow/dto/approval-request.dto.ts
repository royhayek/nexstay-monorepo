import { IsOptional, IsEnum, IsObject, IsArray, IsMongoId } from 'class-validator';
import {
  IsEnumField,
  IsTextAreaField,
  IsIdentifierField,
} from '../../../common/validators/standardized-validators';
import { BaseResponseDto } from '../../../common/dto/base-response.dto';
import { ApiProperty } from '@nestjs/swagger';
import {
  ApprovalActionType,
  ApprovalStatus,
  ApprovalPriority,
} from '../../../database/schemas/admin-action-approval.schema';

/**
 * Create Approval Request DTO
 */
export class CreateApprovalRequestDto {
  @IsEnumField({
    enum: ApprovalActionType,
    required: true,
    description: 'Type of action requiring approval',
    example: ApprovalActionType.USER_PERMANENT_DELETION,
  })
  actionType!: ApprovalActionType;

  @ApiProperty({
    description: 'Action payload containing operation details',
    example: { userId: '507f1f77bcf86cd799439011', username: 'johndoe@example.com' },
  })
  @IsObject()
  actionPayload!: Record<string, any>;

  @IsTextAreaField({
    required: true,
    minLength: 20,
    maxLength: 2000,
    description: 'Detailed reason for requesting this action',
    example:
      'User explicitly requested account deletion via support ticket #12345. All data retention requirements have been met. User has no active bookings or pending payouts.',
  })
  requestReason!: string;

  @IsEnumField({
    enum: ApprovalPriority,
    required: false,
    description: 'Priority level of this approval request',
    example: ApprovalPriority.HIGH,
  })
  @IsOptional()
  priority?: ApprovalPriority;

  @IsIdentifierField({
    required: false,
    description: 'Assign to specific admin for review',
    example: '507f1f77bcf86cd799439012',
  })
  @IsOptional()
  assignedTo?: string;

  @ApiProperty({
    description: 'Additional metadata about the action',
    required: false,
    example: {
      affectedUsers: ['507f1f77bcf86cd799439011'],
      estimatedImpact: 'Single user account deletion',
      riskLevel: 'medium',
    },
  })
  @IsObject()
  @IsOptional()
  metadata?: {
    affectedUsers?: string[];
    affectedResourceIds?: string[];
    estimatedImpact?: string;
    rollbackPlan?: string;
    riskLevel?: 'low' | 'medium' | 'high' | 'critical';
    [key: string]: any;
  };
}

/**
 * Process Approval DTO (Approve/Reject)
 */
export class ProcessApprovalDto {
  @IsEnumField({
    enum: [ApprovalStatus.APPROVED, ApprovalStatus.REJECTED],
    required: true,
    description: 'Approval decision',
    example: ApprovalStatus.APPROVED,
  })
  decision!: ApprovalStatus.APPROVED | ApprovalStatus.REJECTED;

  @IsTextAreaField({
    required: true,
    minLength: 10,
    maxLength: 1000,
    description: 'Comment explaining the decision',
    example: 'Approved after verifying user deletion request and confirming no active bookings.',
  })
  comment!: string;
}

/**
 * Assign Approval DTO
 */
export class AssignApprovalDto {
  @IsIdentifierField({
    required: true,
    description: 'Admin user ID to assign this approval to',
    example: '507f1f77bcf86cd799439012',
  })
  assignedTo!: string;

  @IsTextAreaField({
    required: false,
    minLength: 5,
    maxLength: 500,
    description: 'Optional note about the assignment',
    example: 'Assigning to senior admin for high-risk operation review.',
  })
  @IsOptional()
  note?: string;
}

/**
 * Cancel Approval DTO
 */
export class CancelApprovalDto {
  @IsTextAreaField({
    required: true,
    minLength: 10,
    maxLength: 500,
    description: 'Reason for cancelling the approval request',
    example: 'User changed their mind and no longer wants account deletion.',
  })
  reason!: string;
}

/**
 * Approval Request Query DTO
 */
export class ApprovalRequestQueryDto {
  @IsEnumField({
    enum: ApprovalStatus,
    required: false,
    description: 'Filter by status',
    example: ApprovalStatus.PENDING,
  })
  @IsOptional()
  status?: ApprovalStatus;

  @IsEnumField({
    enum: ApprovalActionType,
    required: false,
    description: 'Filter by action type',
    example: ApprovalActionType.USER_PERMANENT_DELETION,
  })
  @IsOptional()
  actionType?: ApprovalActionType;

  @IsEnumField({
    enum: ApprovalPriority,
    required: false,
    description: 'Filter by priority',
    example: ApprovalPriority.HIGH,
  })
  @IsOptional()
  priority?: ApprovalPriority;

  @IsIdentifierField({
    required: false,
    description: 'Filter by requester user ID',
    example: '507f1f77bcf86cd799439011',
  })
  @IsOptional()
  requestedBy?: string;

  @IsIdentifierField({
    required: false,
    description: 'Filter by assigned admin ID',
    example: '507f1f77bcf86cd799439012',
  })
  @IsOptional()
  assignedTo?: string;

  @ApiProperty({
    description: 'Page number',
    example: 1,
    required: false,
    minimum: 1,
  })
  @IsOptional()
  page?: number;

  @ApiProperty({
    description: 'Items per page',
    example: 20,
    required: false,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  limit?: number;
}

/**
 * Approval Request Item DTO
 */
export class ApprovalRequestDto {
  @ApiProperty({ description: 'Approval request ID', example: '507f1f77bcf86cd799439011' })
  id!: string;

  @ApiProperty({
    description: 'Action type',
    enum: ApprovalActionType,
    example: ApprovalActionType.USER_PERMANENT_DELETION,
  })
  actionType!: ApprovalActionType;

  @ApiProperty({
    description: 'Request status',
    enum: ApprovalStatus,
    example: ApprovalStatus.PENDING,
  })
  status!: ApprovalStatus;

  @ApiProperty({
    description: 'Priority level',
    enum: ApprovalPriority,
    example: ApprovalPriority.HIGH,
  })
  priority!: ApprovalPriority;

  @ApiProperty({ description: 'Requester user ID', example: '507f1f77bcf86cd799439012' })
  requestedBy!: string;

  @ApiProperty({
    description: 'Requester name',
    example: 'John Doe',
  })
  requesterName!: string;

  @ApiProperty({
    description: 'Assigned admin user ID',
    example: '507f1f77bcf86cd799439013',
    required: false,
  })
  assignedTo?: string;

  @ApiProperty({
    description: 'Assigned admin name',
    example: 'Jane Admin',
    required: false,
  })
  assignedToName?: string;

  @ApiProperty({
    description: 'Approver user ID',
    example: '507f1f77bcf86cd799439014',
    required: false,
  })
  approvedBy?: string;

  @ApiProperty({
    description: 'Approver name',
    example: 'Senior Admin',
    required: false,
  })
  approverName?: string;

  @ApiProperty({
    description: 'Action payload',
    example: { userId: '507f1f77bcf86cd799439011' },
  })
  actionPayload!: Record<string, any>;

  @ApiProperty({
    description: 'Request reason',
    example: 'User requested account deletion via support ticket.',
  })
  requestReason!: string;

  @ApiProperty({
    description: 'Approval/rejection comment',
    example: 'Approved after verification.',
    required: false,
  })
  approvalComment?: string;

  @ApiProperty({
    description: 'Request created timestamp',
    example: '2025-10-12T10:00:00.000Z',
  })
  createdAt!: Date;

  @ApiProperty({
    description: 'Last updated timestamp',
    example: '2025-10-12T11:30:00.000Z',
  })
  updatedAt!: Date;

  @ApiProperty({
    description: 'Reviewed timestamp',
    example: '2025-10-12T11:30:00.000Z',
    required: false,
  })
  reviewedAt?: Date;

  @ApiProperty({
    description: 'Expiration timestamp',
    example: '2025-10-15T10:00:00.000Z',
    required: false,
  })
  expiresAt?: Date;

  @ApiProperty({
    description: 'Hours since request',
    example: 36.5,
  })
  hoursSinceRequest!: number;

  @ApiProperty({
    description: 'Is expired',
    example: false,
  })
  isExpired!: boolean;

  @ApiProperty({
    description: 'Additional metadata',
    required: false,
  })
  metadata?: Record<string, any>;
}

/**
 * Approval Statistics DTO
 */
export class ApprovalStatisticsDto {
  @ApiProperty({ description: 'Total pending approvals', example: 12 })
  totalPending!: number;

  @ApiProperty({ description: 'Total approved (last 30 days)', example: 45 })
  totalApproved!: number;

  @ApiProperty({ description: 'Total rejected (last 30 days)', example: 8 })
  totalRejected!: number;

  @ApiProperty({ description: 'Total expired', example: 3 })
  totalExpired!: number;

  @ApiProperty({ description: 'Pending high priority', example: 5 })
  pendingHighPriority!: number;

  @ApiProperty({ description: 'Pending critical priority', example: 2 })
  pendingCritical!: number;

  @ApiProperty({ description: 'Average approval time (hours)', example: 8.5 })
  avgApprovalTimeHours!: number;

  @ApiProperty({
    description: 'Pending by action type',
    example: {
      user_permanent_deletion: 3,
      role_assignment_system_admin: 1,
      financial_adjustment: 2,
    },
  })
  pendingByActionType!: Record<string, number>;

  @ApiProperty({
    description: 'Assigned to me (current user)',
    example: 4,
  })
  assignedToMe!: number;

  @ApiProperty({
    description: 'Statistics generated timestamp',
    example: '2025-10-12T12:00:00.000Z',
  })
  generatedAt!: Date;
}

/**
 * Response DTOs
 */
export class ApprovalRequestListResponseDto {
  @ApiProperty({ type: [ApprovalRequestDto] })
  items!: ApprovalRequestDto[];

  @ApiProperty({ example: 50 })
  total!: number;

  @ApiProperty({ example: 1 })
  page!: number;

  @ApiProperty({ example: 20 })
  limit!: number;

  @ApiProperty({ example: 3 })
  totalPages!: number;

  @ApiProperty({
    description: 'Priority counts',
    example: { low: 10, medium: 20, high: 15, critical: 5 },
  })
  priorityCounts!: {
    low: number;
    medium: number;
    high: number;
    critical: number;
  };
}

export type ApprovalRequestResponseDto = BaseResponseDto<ApprovalRequestDto>;
export type ApprovalRequestListWrapperResponseDto = BaseResponseDto<ApprovalRequestListResponseDto>;
export type ApprovalProcessResponseDto = BaseResponseDto<ApprovalRequestDto>;
export type ApprovalStatisticsResponseDto = BaseResponseDto<ApprovalStatisticsDto>;
