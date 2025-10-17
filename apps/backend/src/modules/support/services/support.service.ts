import { Injectable, BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Booking, type BookingDocument } from '../../../database/schemas/booking.schema';
import { Conversation, type ConversationDocument, SupportTicketStatus } from '../../../database/schemas/conversation.schema';
import { AuditLog, type AuditLogDocument, AuditLogAction, AuditLogResult, AuditLogSeverity } from '../../../database/schemas/audit-log.schema';
import { User, type UserDocument, UserRole } from '../../../database/schemas/user.schema';
import { IssueRefundDto, RequestRefundApprovalDto } from '../dto/issue-refund.dto';
import { RefundResultDto, ApprovalRequestResultDto, TicketAssignmentResultDto, SupportStatsResultDto } from '../dto/support-action-response.dto';
import { LoggingUtil } from '../../../common/utils/logging.util';

/**
 * Support-specific constants
 */
export const SUPPORT_CONSTANTS = {
  MAX_REFUND_WITHOUT_APPROVAL: 500, // Maximum refund amount support can issue without admin approval
  REFUND_CURRENCY: 'USD', // Default refund currency
  URGENT_TICKET_THRESHOLD_HOURS: 24, // Hours before ticket is considered urgent
} as const;

/**
 * Support Service
 * Handles support operations with role-based permission boundaries
 */
@Injectable()
export class SupportService {
  constructor(
    @InjectModel(Booking.name) private readonly bookingModel: Model<BookingDocument>,
    @InjectModel(Conversation.name) private readonly conversationModel: Model<ConversationDocument>,
    @InjectModel(AuditLog.name) private readonly auditLogModel: Model<AuditLogDocument>,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  /**
   * Issue a refund for a booking with permission boundary checks
   * Support role can only refund up to $500 without admin approval
   */
  async issueRefund(
    dto: IssueRefundDto,
    supportUserId: string,
    supportUserRoles: UserRole[],
    ipAddress?: string,
  ): Promise<RefundResultDto> {
    // Validate booking exists
    const booking = await this.bookingModel
      .findById(dto.bookingId)
      .populate('guestId', 'firstName lastName email')
      .populate('hostId', 'firstName lastName email')
      .exec();

    if (!booking) {
      throw new NotFoundException(`Booking ${dto.bookingId} not found`);
    }

    // Check if booking can be refunded
    if (booking.refundAmount && booking.refundAmount > 0) {
      throw new BadRequestException('This booking has already been refunded');
    }

    // Permission boundary: Support role has $500 limit
    const isSupport = supportUserRoles.includes(UserRole.SUPPORT);
    const isAdmin = supportUserRoles.includes(UserRole.ADMIN) || supportUserRoles.includes(UserRole.SYSTEM_ADMIN);

    if (isSupport && !isAdmin && dto.amount > SUPPORT_CONSTANTS.MAX_REFUND_WITHOUT_APPROVAL) {
      throw new ForbiddenException(
        `Support role cannot issue refunds over $${SUPPORT_CONSTANTS.MAX_REFUND_WITHOUT_APPROVAL}. ` +
        `Requested amount: $${dto.amount}. Please request admin approval.`
      );
    }

    // Validate refund amount does not exceed booking total
    if (dto.amount > booking.pricing.totalAmount) {
      throw new BadRequestException(
        `Refund amount ($${dto.amount}) cannot exceed booking total ($${booking.pricing.totalAmount})`
      );
    }

    // Update booking with refund information
    booking.refundAmount = dto.amount;
    booking.refundDate = new Date();
    booking.paymentStatus = 'refunded' as any; // Update payment status

    await booking.save();

    // Create audit log for refund action
    await this.createAuditLog({
      userId: new Types.ObjectId(supportUserId),
      action: AuditLogAction.SUPPORT_REFUND_ISSUED,
      result: AuditLogResult.SUCCESS,
      severity: dto.amount > 100 ? AuditLogSeverity.HIGH : AuditLogSeverity.MEDIUM,
      resourceType: 'Booking',
      resourceId: dto.bookingId,
      ipAddress,
      description: `Support issued refund of $${dto.amount} for booking ${dto.bookingId}`,
      metadata: {
        refundAmount: dto.amount,
        currency: booking.pricing.currency,
        reason: dto.reason,
        internalNotes: dto.internalNotes,
        supportTicketId: dto.supportTicketId,
        guestId: String(booking.guestId),
        hostId: String(booking.hostId),
        requiredApproval: false,
      },
    });

    LoggingUtil.log(
      `Refund issued: $${dto.amount} for booking ${dto.bookingId} by support user ${supportUserId}`,
      'SupportService'
    );

    return {
      bookingId: String(booking._id),
      refundAmount: dto.amount,
      currency: booking.pricing.currency,
      reason: dto.reason,
      refundDate: booking.refundDate,
      issuedBy: supportUserId,
      requiredApproval: false,
    };
  }

  /**
   * Request admin approval for refund exceeding support limit
   */
  async requestRefundApproval(
    dto: RequestRefundApprovalDto,
    supportUserId: string,
    ipAddress?: string,
  ): Promise<ApprovalRequestResultDto> {
    // Validate booking exists
    const booking = await this.bookingModel.findById(dto.bookingId).exec();

    if (!booking) {
      throw new NotFoundException(`Booking ${dto.bookingId} not found`);
    }

    // Validate amount exceeds support limit
    if (dto.amount <= SUPPORT_CONSTANTS.MAX_REFUND_WITHOUT_APPROVAL) {
      throw new BadRequestException(
        `Refund amount ($${dto.amount}) is within support limit. ` +
        `No approval required for amounts up to $${SUPPORT_CONSTANTS.MAX_REFUND_WITHOUT_APPROVAL}.`
      );
    }

    // Create approval request (would normally be stored in a separate ApprovalRequest schema)
    // For now, we'll create a support conversation with high priority
    const approvalRequestId = new Types.ObjectId();

    // Create audit log for approval request
    await this.createAuditLog({
      userId: new Types.ObjectId(supportUserId),
      action: AuditLogAction.SUPPORT_ESCALATION_REQUESTED,
      result: AuditLogResult.SUCCESS,
      severity: AuditLogSeverity.HIGH,
      resourceType: 'Booking',
      resourceId: dto.bookingId,
      ipAddress,
      description: `Support requested approval for refund of $${dto.amount} (exceeds $${SUPPORT_CONSTANTS.MAX_REFUND_WITHOUT_APPROVAL} limit)`,
      metadata: {
        approvalRequestId: String(approvalRequestId),
        refundAmount: dto.amount,
        reason: dto.reason,
        justification: dto.approvalJustification,
        approverUserId: dto.approverUserId,
        bookingId: dto.bookingId,
      },
    });

    LoggingUtil.log(
      `Refund approval requested: $${dto.amount} for booking ${dto.bookingId} by support user ${supportUserId}`,
      'SupportService'
    );

    return {
      requestId: String(approvalRequestId),
      status: 'pending_approval',
      requestedAmount: dto.amount,
      bookingId: dto.bookingId,
      requestedBy: supportUserId,
      requestedAt: new Date(),
      assignedTo: dto.approverUserId,
    };
  }

  /**
   * Assign a support ticket to a support agent
   */
  async assignTicket(
    conversationId: string,
    assignedToUserId: string,
    assignedByUserId: string,
    ipAddress?: string,
  ): Promise<TicketAssignmentResultDto> {
    const conversation = await this.conversationModel.findById(conversationId).exec();

    if (!conversation) {
      throw new NotFoundException(`Conversation ${conversationId} not found`);
    }

    // Verify it's a support conversation
    if (conversation.type !== 'support_guest' && conversation.type !== 'support_host') {
      throw new BadRequestException('Can only assign support conversations');
    }

    // Verify assigned user is a support agent
    const assignedUser = await this.userModel.findById(assignedToUserId).exec();
    if (!assignedUser) {
      throw new NotFoundException(`User ${assignedToUserId} not found`);
    }

    if (!assignedUser.roles.includes(UserRole.SUPPORT) && !assignedUser.roles.includes(UserRole.ADMIN)) {
      throw new BadRequestException('Can only assign tickets to support agents or admins');
    }

    // Update conversation
    conversation.assigned_support_agent = new Types.ObjectId(assignedToUserId);
    conversation.support_status = SupportTicketStatus.IN_PROGRESS;
    await conversation.save();

    // Create audit log
    await this.createAuditLog({
      userId: new Types.ObjectId(assignedByUserId),
      action: AuditLogAction.SUPPORT_TICKET_ASSIGNED,
      result: AuditLogResult.SUCCESS,
      severity: AuditLogSeverity.LOW,
      resourceType: 'Conversation',
      resourceId: conversationId,
      ipAddress,
      description: `Support ticket assigned to ${assignedUser.firstName} ${assignedUser.lastName}`,
      metadata: {
        conversationId,
        assignedToUserId,
        assignedToName: `${assignedUser.firstName} ${assignedUser.lastName}`,
        priority: conversation.priority,
      },
    });

    return {
      conversationId,
      assignedTo: assignedToUserId,
      assignedAgentName: `${assignedUser.firstName} ${assignedUser.lastName}`,
      priority: conversation.priority,
      assignedAt: new Date(),
    };
  }

  /**
   * Get support statistics for current agent
   */
  async getSupportStats(supportUserId: string): Promise<SupportStatsResultDto> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Get active tickets count
    const activeTickets = await this.conversationModel.countDocuments({
      type: { $in: ['support_guest', 'support_host'] },
      support_status: { $in: [SupportTicketStatus.OPEN, SupportTicketStatus.IN_PROGRESS, SupportTicketStatus.PENDING_USER] },
    }).exec();

    // Get tickets assigned to current agent
    const assignedToMe = await this.conversationModel.countDocuments({
      assigned_support_agent: new Types.ObjectId(supportUserId),
      support_status: { $in: [SupportTicketStatus.OPEN, SupportTicketStatus.IN_PROGRESS, SupportTicketStatus.PENDING_USER] },
    }).exec();

    // Get pending user tickets
    const pendingUser = await this.conversationModel.countDocuments({
      type: { $in: ['support_guest', 'support_host'] },
      support_status: SupportTicketStatus.PENDING_USER,
    }).exec();

    // Get urgent tickets
    const urgentTickets = await this.conversationModel.countDocuments({
      type: { $in: ['support_guest', 'support_host'] },
      priority: 'urgent',
      support_status: { $in: [SupportTicketStatus.OPEN, SupportTicketStatus.IN_PROGRESS] },
    }).exec();

    // Get refunds issued this month
    const refundsThisMonth = await this.auditLogModel.countDocuments({
      action: AuditLogAction.SUPPORT_REFUND_ISSUED,
      createdAt: { $gte: startOfMonth },
    }).exec();

    // Get total refund amount this month
    const refundLogs = await this.auditLogModel.find({
      action: AuditLogAction.SUPPORT_REFUND_ISSUED,
      createdAt: { $gte: startOfMonth },
    }).exec();

    const refundAmountThisMonth = refundLogs.reduce((sum, log) => {
      return sum + (log.metadata?.refundAmount || 0);
    }, 0);

    // Calculate average resolution time (simplified - would need more complex query in production)
    const resolvedTickets = await this.conversationModel.find({
      type: { $in: ['support_guest', 'support_host'] },
      support_status: { $in: [SupportTicketStatus.RESOLVED, SupportTicketStatus.CLOSED] },
      updatedAt: { $gte: startOfMonth },
    }).exec();

    const averageResolutionTimeHours = resolvedTickets.length > 0
      ? resolvedTickets.reduce((sum, ticket) => {
          const hours = (ticket.updatedAt.getTime() - ticket.createdAt.getTime()) / (1000 * 60 * 60);
          return sum + hours;
        }, 0) / resolvedTickets.length
      : 0;

    return {
      activeTickets,
      assignedToMe,
      pendingUser,
      urgentTickets,
      refundsIssuedThisMonth: refundsThisMonth,
      refundAmountThisMonth,
      averageResolutionTimeHours: Math.round(averageResolutionTimeHours * 10) / 10, // Round to 1 decimal
    };
  }

  /**
   * Helper method to create audit logs
   */
  private async createAuditLog(data: {
    userId: Types.ObjectId;
    action: AuditLogAction;
    result: AuditLogResult;
    severity: AuditLogSeverity;
    resourceType?: string;
    resourceId?: string;
    ipAddress?: string;
    description?: string;
    metadata?: Record<string, any>;
  }): Promise<void> {
    try {
      await this.auditLogModel.create(data);
    } catch (error) {
      LoggingUtil.error('Failed to create audit log', error instanceof Error ? error.stack : undefined, 'SupportService');
    }
  }
}
