import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  AdminActionApproval,
  AdminActionApprovalDocument,
  ApprovalActionType,
  ApprovalStatus,
  ApprovalPriority,
} from '../../../database/schemas/admin-action-approval.schema';
import { User, UserDocument } from '../../../database/schemas/user.schema';
import { AuditLog, AuditLogDocument, AuditLogAction } from '../../../database/schemas/audit-log.schema';
import {
  CreateApprovalRequestDto,
  ProcessApprovalDto,
  AssignApprovalDto,
  CancelApprovalDto,
  ApprovalRequestQueryDto,
  ApprovalRequestDto,
  ApprovalRequestListResponseDto,
  ApprovalStatisticsDto,
} from '../dto/approval-request.dto';
import { DateUtils } from '../../../common/utils/date.utils';

/**
 * Approval thresholds and rules
 */
export const APPROVAL_RULES = {
  BULK_OPERATION_THRESHOLD: 10, // >10 items requires approval
  FINANCIAL_ADJUSTMENT_THRESHOLD: 1000, // >$1000 requires approval
  DEFAULT_EXPIRATION_HOURS: 72, // 3 days
  CRITICAL_EXPIRATION_HOURS: 24, // 1 day for critical
};

/**
 * Approval Workflow Service
 * Handles approval requests for critical administrative operations
 */
@Injectable()
export class ApprovalWorkflowService {
  constructor(
    @InjectModel(AdminActionApproval.name)
    private readonly approvalModel: Model<AdminActionApprovalDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    @InjectModel(AuditLog.name)
    private readonly auditLogModel: Model<AuditLogDocument>,
  ) {}

  /**
   * Create a new approval request
   */
  async createApprovalRequest(
    dto: CreateApprovalRequestDto,
    requestedById: string,
    ipAddress?: string,
  ): Promise<ApprovalRequestDto> {
    const now = DateUtils.now();

    // Calculate expiration based on priority
    const expirationHours =
      dto.priority === ApprovalPriority.CRITICAL
        ? APPROVAL_RULES.CRITICAL_EXPIRATION_HOURS
        : APPROVAL_RULES.DEFAULT_EXPIRATION_HOURS;

    const expiresAt = new Date(now.getTime() + expirationHours * 60 * 60 * 1000);

    // Create approval request
    const approval = await this.approvalModel.create({
      actionType: dto.actionType,
      requestedBy: new Types.ObjectId(requestedById),
      assignedTo: dto.assignedTo ? new Types.ObjectId(dto.assignedTo) : undefined,
      status: ApprovalStatus.PENDING,
      priority: dto.priority || ApprovalPriority.MEDIUM,
      actionPayload: dto.actionPayload,
      requestReason: dto.requestReason,
      expiresAt,
      ipAddress,
      metadata: dto.metadata,
      statusHistory: [
        {
          status: ApprovalStatus.PENDING,
          changedAt: now,
          changedBy: new Types.ObjectId(requestedById),
          comment: 'Approval request created',
        },
      ],
    });

    // Create audit log
    await this.auditLogModel.create({
      userId: new Types.ObjectId(requestedById),
      action: AuditLogAction.ADMIN_ACTION_PERFORMED,
      result: 'success',
      resourceType: 'AdminActionApproval',
      resourceId: (approval._id as Types.ObjectId).toString(),
      ipAddress,
      metadata: {
        approvalId: (approval._id as Types.ObjectId).toString(),
        actionType: dto.actionType,
        priority: dto.priority,
        expiresAt: expiresAt.toISOString(),
      },
      description: `Created approval request for ${dto.actionType}`,
    });

    return this.mapToDto(await approval.populate(['requestedBy', 'assignedTo']));
  }

  /**
   * Process approval request (approve or reject)
   */
  async processApproval(
    approvalId: string,
    dto: ProcessApprovalDto,
    reviewerId: string,
    ipAddress?: string,
  ): Promise<ApprovalRequestDto> {
    const approval = await this.approvalModel
      .findById(approvalId)
      .populate(['requestedBy', 'assignedTo']);

    if (!approval) {
      throw new NotFoundException(`Approval request not found: ${approvalId}`);
    }

    if (approval.status !== ApprovalStatus.PENDING) {
      throw new BadRequestException(
        `Cannot process approval with status: ${approval.status}. Only pending approvals can be processed.`,
      );
    }

    // Check if expired
    if (approval.expiresAt && approval.expiresAt < DateUtils.now()) {
      throw new BadRequestException('This approval request has expired');
    }

    // Prevent self-approval
    if (approval.requestedBy.toString() === reviewerId) {
      throw new ForbiddenException('You cannot approve your own request');
    }

    const now = DateUtils.now();

    // Update approval
    approval.status = dto.decision;
    approval.approvedBy = new Types.ObjectId(reviewerId);
    approval.approvalComment = dto.comment;
    approval.reviewedAt = now;

    approval.statusHistory.push({
      status: dto.decision,
      changedAt: now,
      changedBy: new Types.ObjectId(reviewerId),
      comment: dto.comment,
    });

    await approval.save();

    // Create audit log
    await this.auditLogModel.create({
      userId: new Types.ObjectId(reviewerId),
      action: AuditLogAction.ADMIN_ACTION_PERFORMED,
      result: 'success',
      resourceType: 'AdminActionApproval',
      resourceId: (approval._id as Types.ObjectId).toString(),
      ipAddress,
      metadata: {
        approvalId: (approval._id as Types.ObjectId).toString(),
        actionType: approval.actionType,
        decision: dto.decision,
        requestedBy: approval.requestedBy.toString(),
      },
      description: `${dto.decision === ApprovalStatus.APPROVED ? 'Approved' : 'Rejected'} approval request for ${approval.actionType}`,
    });

    return this.mapToDto(await approval.populate('approvedBy'));
  }

  /**
   * Assign approval request to a specific admin
   */
  async assignApproval(
    approvalId: string,
    dto: AssignApprovalDto,
    assignerId: string,
    ipAddress?: string,
  ): Promise<ApprovalRequestDto> {
    const approval = await this.approvalModel
      .findById(approvalId)
      .populate(['requestedBy', 'assignedTo']);

    if (!approval) {
      throw new NotFoundException(`Approval request not found: ${approvalId}`);
    }

    if (approval.status !== ApprovalStatus.PENDING) {
      throw new BadRequestException(
        `Cannot assign approval with status: ${approval.status}`,
      );
    }

    // Verify assignee exists and has appropriate role
    const assignee = await this.userModel.findById(dto.assignedTo);
    if (!assignee) {
      throw new NotFoundException(`User not found: ${dto.assignedTo}`);
    }

    const now = DateUtils.now();

    // Update assignment
    approval.assignedTo = new Types.ObjectId(dto.assignedTo);

    approval.statusHistory.push({
      status: ApprovalStatus.PENDING,
      changedAt: now,
      changedBy: new Types.ObjectId(assignerId),
      comment: dto.note || `Assigned to ${assignee.firstName} ${assignee.lastName}`,
    });

    await approval.save();

    // Create audit log
    await this.auditLogModel.create({
      userId: new Types.ObjectId(assignerId),
      action: AuditLogAction.ADMIN_ACTION_PERFORMED,
      result: 'success',
      resourceType: 'AdminActionApproval',
      resourceId: (approval._id as Types.ObjectId).toString(),
      ipAddress,
      metadata: {
        approvalId: (approval._id as Types.ObjectId).toString(),
        assignedTo: dto.assignedTo,
        assignedToName: `${assignee.firstName} ${assignee.lastName}`,
      },
      description: `Assigned approval request to ${assignee.firstName} ${assignee.lastName}`,
    });

    return this.mapToDto(await approval.populate('assignedTo'));
  }

  /**
   * Cancel a pending approval request
   */
  async cancelApproval(
    approvalId: string,
    dto: CancelApprovalDto,
    userId: string,
    ipAddress?: string,
  ): Promise<ApprovalRequestDto> {
    const approval = await this.approvalModel
      .findById(approvalId)
      .populate(['requestedBy', 'assignedTo']);

    if (!approval) {
      throw new NotFoundException(`Approval request not found: ${approvalId}`);
    }

    if (approval.status !== ApprovalStatus.PENDING) {
      throw new BadRequestException(
        `Cannot cancel approval with status: ${approval.status}`,
      );
    }

    // Only requester can cancel their own request
    if (approval.requestedBy.toString() !== userId) {
      throw new ForbiddenException('You can only cancel your own approval requests');
    }

    const now = DateUtils.now();

    // Update status
    approval.status = ApprovalStatus.CANCELLED;
    approval.approvalComment = dto.reason;
    approval.reviewedAt = now;

    approval.statusHistory.push({
      status: ApprovalStatus.CANCELLED,
      changedAt: now,
      changedBy: new Types.ObjectId(userId),
      comment: dto.reason,
    });

    await approval.save();

    // Create audit log
    await this.auditLogModel.create({
      userId: new Types.ObjectId(userId),
      action: AuditLogAction.ADMIN_ACTION_PERFORMED,
      result: 'success',
      resourceType: 'AdminActionApproval',
      resourceId: (approval._id as Types.ObjectId).toString(),
      ipAddress,
      metadata: {
        approvalId: (approval._id as Types.ObjectId).toString(),
        actionType: approval.actionType,
      },
      description: `Cancelled approval request for ${approval.actionType}`,
    });

    return this.mapToDto(approval);
  }

  /**
   * Get approval request by ID
   */
  async getApprovalById(approvalId: string): Promise<ApprovalRequestDto> {
    const approval = await this.approvalModel
      .findById(approvalId)
      .populate(['requestedBy', 'assignedTo', 'approvedBy']);

    if (!approval) {
      throw new NotFoundException(`Approval request not found: ${approvalId}`);
    }

    return this.mapToDto(approval);
  }

  /**
   * List approval requests with filters
   */
  async listApprovalRequests(
    query: ApprovalRequestQueryDto,
    userId?: string,
  ): Promise<ApprovalRequestListResponseDto> {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    // Build filter
    const filter: any = {};

    if (query.status) {
      filter.status = query.status;
    }

    if (query.actionType) {
      filter.actionType = query.actionType;
    }

    if (query.priority) {
      filter.priority = query.priority;
    }

    if (query.requestedBy) {
      filter.requestedBy = new Types.ObjectId(query.requestedBy);
    }

    if (query.assignedTo) {
      filter.assignedTo = new Types.ObjectId(query.assignedTo);
    }

    // Get approvals with populated fields
    const approvals = await this.approvalModel
      .find(filter)
      .populate(['requestedBy', 'assignedTo', 'approvedBy'])
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await this.approvalModel.countDocuments(filter);

    // Map to DTOs
    const items = approvals.map((approval: any) => this.mapToDto(approval));

    // Calculate priority counts
    const allApprovals = await this.approvalModel
      .find({ ...filter, status: ApprovalStatus.PENDING })
      .lean();

    const priorityCounts = {
      low: allApprovals.filter((a) => a.priority === ApprovalPriority.LOW).length,
      medium: allApprovals.filter((a) => a.priority === ApprovalPriority.MEDIUM).length,
      high: allApprovals.filter((a) => a.priority === ApprovalPriority.HIGH).length,
      critical: allApprovals.filter((a) => a.priority === ApprovalPriority.CRITICAL).length,
    };

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      priorityCounts,
    };
  }

  /**
   * Get approval statistics
   */
  async getApprovalStatistics(userId: string): Promise<ApprovalStatisticsDto> {
    const now = DateUtils.now();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Pending counts
    const totalPending = await this.approvalModel.countDocuments({
      status: ApprovalStatus.PENDING,
    });

    const pendingHighPriority = await this.approvalModel.countDocuments({
      status: ApprovalStatus.PENDING,
      priority: ApprovalPriority.HIGH,
    });

    const pendingCritical = await this.approvalModel.countDocuments({
      status: ApprovalStatus.PENDING,
      priority: ApprovalPriority.CRITICAL,
    });

    const assignedToMe = await this.approvalModel.countDocuments({
      status: ApprovalStatus.PENDING,
      assignedTo: new Types.ObjectId(userId),
    });

    // Last 30 days stats
    const totalApproved = await this.approvalModel.countDocuments({
      status: ApprovalStatus.APPROVED,
      reviewedAt: { $gte: thirtyDaysAgo },
    });

    const totalRejected = await this.approvalModel.countDocuments({
      status: ApprovalStatus.REJECTED,
      reviewedAt: { $gte: thirtyDaysAgo },
    });

    const totalExpired = await this.approvalModel.countDocuments({
      status: ApprovalStatus.EXPIRED,
    });

    // Average approval time
    const approvedRequests = await this.approvalModel
      .find({
        status: ApprovalStatus.APPROVED,
        reviewedAt: { $gte: thirtyDaysAgo },
      })
      .lean();

    const totalApprovalTimeMs = approvedRequests.reduce((sum, approval) => {
      const created = new Date(approval.createdAt).getTime();
      const reviewed = new Date(approval.reviewedAt!).getTime();
      return sum + (reviewed - created);
    }, 0);

    const avgApprovalTimeHours =
      approvedRequests.length > 0
        ? totalApprovalTimeMs / (1000 * 60 * 60) / approvedRequests.length
        : 0;

    // Pending by action type
    const pendingByActionType: Record<string, number> = {};
    const pendingApprovals = await this.approvalModel
      .find({ status: ApprovalStatus.PENDING })
      .lean();

    for (const approval of pendingApprovals) {
      pendingByActionType[approval.actionType] =
        (pendingByActionType[approval.actionType] || 0) + 1;
    }

    return {
      totalPending,
      totalApproved,
      totalRejected,
      totalExpired,
      pendingHighPriority,
      pendingCritical,
      avgApprovalTimeHours: Math.round(avgApprovalTimeHours * 10) / 10,
      pendingByActionType,
      assignedToMe,
      generatedAt: now,
    };
  }

  /**
   * Check if an action requires approval
   */
  requiresApproval(actionType: ApprovalActionType, context?: any): boolean {
    switch (actionType) {
      case ApprovalActionType.USER_PERMANENT_DELETION:
        return true; // Always requires approval

      case ApprovalActionType.ROLE_ASSIGNMENT_SYSTEM_ADMIN:
        return true; // Always requires approval

      case ApprovalActionType.USER_BULK_OPERATION:
        return context?.count > APPROVAL_RULES.BULK_OPERATION_THRESHOLD;

      case ApprovalActionType.FINANCIAL_ADJUSTMENT:
        return context?.amount > APPROVAL_RULES.FINANCIAL_ADJUSTMENT_THRESHOLD;

      case ApprovalActionType.SYSTEM_CONFIG_CHANGE:
        return true; // Always requires approval

      case ApprovalActionType.REFUND_EXCEEDING_LIMIT:
        return true; // Always requires approval (already exceeded support limit)

      case ApprovalActionType.PROPERTY_BULK_OPERATION:
        return context?.count > APPROVAL_RULES.BULK_OPERATION_THRESHOLD;

      case ApprovalActionType.BOOKING_BULK_OPERATION:
        return context?.count > APPROVAL_RULES.BULK_OPERATION_THRESHOLD;

      default:
        return false;
    }
  }

  /**
   * Expire old pending approval requests
   */
  async expireApprovals(): Promise<number> {
    const now = DateUtils.now();

    const result = await this.approvalModel.updateMany(
      {
        status: ApprovalStatus.PENDING,
        expiresAt: { $lte: now },
      },
      {
        $set: {
          status: ApprovalStatus.EXPIRED,
          reviewedAt: now,
        },
        $push: {
          statusHistory: {
            status: ApprovalStatus.EXPIRED,
            changedAt: now,
            comment: 'Automatically expired due to timeout',
          },
        },
      },
    );

    return result.modifiedCount;
  }

  /**
   * Map approval document to DTO
   */
  private mapToDto(approval: any): ApprovalRequestDto {
    const now = DateUtils.now();
    const createdAt = new Date(approval.createdAt);
    const hoursSinceRequest = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
    const isExpired = approval.expiresAt ? approval.expiresAt < now : false;

    const requesterName =
      approval.requestedBy?.firstName && approval.requestedBy?.lastName
        ? `${approval.requestedBy.firstName} ${approval.requestedBy.lastName}`
        : 'Unknown';

    const assignedToName =
      approval.assignedTo?.firstName && approval.assignedTo?.lastName
        ? `${approval.assignedTo.firstName} ${approval.assignedTo.lastName}`
        : undefined;

    const approverName =
      approval.approvedBy?.firstName && approval.approvedBy?.lastName
        ? `${approval.approvedBy.firstName} ${approval.approvedBy.lastName}`
        : undefined;

    return {
      id: approval._id.toString(),
      actionType: approval.actionType,
      status: approval.status,
      priority: approval.priority,
      requestedBy: approval.requestedBy?._id?.toString() || approval.requestedBy?.toString(),
      requesterName,
      assignedTo: approval.assignedTo?._id?.toString() || approval.assignedTo?.toString(),
      assignedToName,
      approvedBy: approval.approvedBy?._id?.toString() || approval.approvedBy?.toString(),
      approverName,
      actionPayload: approval.actionPayload,
      requestReason: approval.requestReason,
      approvalComment: approval.approvalComment,
      createdAt: approval.createdAt,
      updatedAt: approval.updatedAt,
      reviewedAt: approval.reviewedAt,
      expiresAt: approval.expiresAt,
      hoursSinceRequest: Math.round(hoursSinceRequest * 10) / 10,
      isExpired,
      metadata: approval.metadata,
    };
  }
}
