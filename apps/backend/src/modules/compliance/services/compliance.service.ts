import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  IdentityVerification,
  IdentityVerificationDocument,
  VerificationStatus,
  VerificationRejectionReason,
} from '../../../database/schemas/identity-verification.schema';
import { User, UserDocument } from '../../../database/schemas/user.schema';
import { AuditLog, AuditLogDocument, AuditLogAction } from '../../../database/schemas/audit-log.schema';
import {
  MonthlyComplianceReportDto,
  ComplianceStatisticsDto,
} from '../dto/compliance-report.dto';
import {
  VerificationQueueItemDto,
  VerificationQueueResponseDto,
  AgingAlertItemDto,
  AgingAlertsResponseDto,
  VerificationQueueQueryDto,
  AgingAlertsQueryDto,
} from '../dto/verification-queue.dto';
import {
  BulkOperationResultDto,
  BulkOperationResultItemDto,
  BulkApproveVerificationsDto,
  BulkRejectVerificationsDto,
} from '../dto/bulk-verification.dto';
import { DateUtils } from '../../../common/utils/date.utils';

/**
 * Compliance Service
 * Handles compliance-specific operations for identity verification
 */
@Injectable()
export class ComplianceService {
  constructor(
    @InjectModel(IdentityVerification.name)
    private readonly verificationModel: Model<IdentityVerificationDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    @InjectModel(AuditLog.name)
    private readonly auditLogModel: Model<AuditLogDocument>,
  ) {}

  /**
   * Get verification queue with priority sorting
   * Optimized for compliance team workflow
   */
  async getVerificationQueue(
    query: VerificationQueueQueryDto,
  ): Promise<VerificationQueueResponseDto> {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    // Build filter
    const filter: any = {
      status: { $in: [VerificationStatus.PENDING, VerificationStatus.UNDER_REVIEW] },
      isActive: true,
    };

    if (query.documentType) {
      filter.documentType = query.documentType;
    }

    // Get verifications with user details
    const verifications = await this.verificationModel
      .find(filter)
      .populate('userId', 'firstName lastName email')
      .skip(skip)
      .limit(limit)
      .lean()
      .exec();

    const total = await this.verificationModel.countDocuments(filter);

    // Transform to queue items with priority calculation
    const now = DateUtils.now();
    let items: VerificationQueueItemDto[] = verifications.map((verification: any) => {
      const submittedAt = new Date(verification.submittedAt || verification.createdAt);
      const hoursSinceSubmission = (now.getTime() - submittedAt.getTime()) / (1000 * 60 * 60);
      const daysSinceSubmission = hoursSinceSubmission / 24;

      // Calculate priority based on aging
      let priority: 'low' | 'medium' | 'high' | 'critical';
      if (daysSinceSubmission >= 7) {
        priority = 'critical';
      } else if (daysSinceSubmission >= 2) {
        priority = 'high';
      } else if (hoursSinceSubmission >= 24) {
        priority = 'medium';
      } else {
        priority = 'low';
      }

      // Adjust priority based on attempt count and risk score
      if (verification.attemptCount > 1) {
        priority = priority === 'critical' ? 'critical' : 'high';
      }
      if (verification.metadata?.fraudDetection?.riskScore && verification.metadata.fraudDetection.riskScore > 0.7) {
        priority = 'critical';
      }

      return {
        id: verification._id.toString(),
        userId: verification.userId._id?.toString() || verification.userId,
        userName: verification.userId.firstName && verification.userId.lastName
          ? `${verification.userId.firstName} ${verification.userId.lastName}`
          : 'Unknown',
        documentType: verification.documentType,
        issuingCountry: verification.issuingCountry,
        status: verification.status,
        submittedAt,
        hoursSinceSubmission: Math.round(hoursSinceSubmission * 10) / 10,
        priority,
        attemptCount: verification.attemptCount,
        hasSelfie: !!verification.selfieImageUrl,
        hasProofOfAddress: !!verification.proofOfAddressImageUrl,
        riskScore: verification.metadata?.fraudDetection?.riskScore,
        fraudFlags: verification.metadata?.fraudDetection?.flags || [],
      };
    });

    // Apply priority filter if specified
    if (query.priority) {
      items = items.filter((item) => item.priority === query.priority);
    }

    // Sort based on sortBy parameter
    switch (query.sortBy) {
      case 'oldest':
        items.sort((a, b) => b.hoursSinceSubmission - a.hoursSinceSubmission);
        break;
      case 'newest':
        items.sort((a, b) => a.hoursSinceSubmission - b.hoursSinceSubmission);
        break;
      case 'priority':
        const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        items.sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]);
        break;
      case 'risk':
        items.sort((a, b) => (b.riskScore || 0) - (a.riskScore || 0));
        break;
      default:
        // Default: priority first, then oldest
        const priorityOrder2 = { critical: 4, high: 3, medium: 2, low: 1 };
        items.sort((a, b) => {
          const priorityDiff = priorityOrder2[b.priority] - priorityOrder2[a.priority];
          if (priorityDiff !== 0) return priorityDiff;
          return b.hoursSinceSubmission - a.hoursSinceSubmission;
        });
    }

    // Calculate priority counts
    const priorityCounts = {
      low: items.filter((i) => i.priority === 'low').length,
      medium: items.filter((i) => i.priority === 'medium').length,
      high: items.filter((i) => i.priority === 'high').length,
      critical: items.filter((i) => i.priority === 'critical').length,
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
   * Get aging alerts for verifications requiring attention
   */
  async getAgingAlerts(query: AgingAlertsQueryDto): Promise<AgingAlertsResponseDto> {
    const minDays = query.minDays || 2; // Default: 2 days threshold
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() - minDays);

    const filter: any = {
      status: { $in: [VerificationStatus.PENDING, VerificationStatus.UNDER_REVIEW] },
      isActive: true,
      $or: [
        { submittedAt: { $lte: thresholdDate } },
        { createdAt: { $lte: thresholdDate }, submittedAt: { $exists: false } },
      ],
    };

    const verifications = await this.verificationModel
      .find(filter)
      .populate('userId', 'firstName lastName email')
      .sort({ createdAt: 1 }) // Oldest first
      .lean()
      .exec();

    const now = DateUtils.now();
    let items: AgingAlertItemDto[] = verifications.map((verification: any) => {
      const submittedAt = new Date(verification.submittedAt || verification.createdAt);
      const daysSinceSubmission = Math.ceil(
        (now.getTime() - submittedAt.getTime()) / (1000 * 60 * 60 * 24),
      );

      // Determine alert level
      let alertLevel: 'warning' | 'urgent' | 'critical';
      let alertReason: string;

      if (daysSinceSubmission >= 7) {
        alertLevel = 'critical';
        alertReason = `Verification pending for ${daysSinceSubmission} days - CRITICAL`;
      } else if (daysSinceSubmission >= 4) {
        alertLevel = 'urgent';
        alertReason = `Verification pending for ${daysSinceSubmission} days - Urgent attention required`;
      } else {
        alertLevel = 'warning';
        alertReason = `Verification pending for ${daysSinceSubmission} days`;
      }

      return {
        id: verification._id.toString(),
        userId: verification.userId._id?.toString() || verification.userId,
        userName:
          verification.userId.firstName && verification.userId.lastName
            ? `${verification.userId.firstName} ${verification.userId.lastName}`
            : 'Unknown',
        userEmail: verification.userId.email || '',
        documentType: verification.documentType,
        submittedAt,
        daysSinceSubmission,
        alertLevel,
        alertReason,
        attemptCount: verification.attemptCount,
      };
    });

    // Apply alert level filter if specified
    if (query.alertLevel) {
      items = items.filter((item) => item.alertLevel === query.alertLevel);
    }

    // Calculate alert level counts
    const alertLevelCounts = {
      warning: items.filter((i) => i.alertLevel === 'warning').length,
      urgent: items.filter((i) => i.alertLevel === 'urgent').length,
      critical: items.filter((i) => i.alertLevel === 'critical').length,
    };

    return {
      items,
      total: items.length,
      alertLevelCounts,
    };
  }

  /**
   * Bulk approve verifications
   */
  async bulkApproveVerifications(
    dto: BulkApproveVerificationsDto,
    reviewerId: string,
    ipAddress?: string,
  ): Promise<BulkOperationResultDto> {
    const results: BulkOperationResultItemDto[] = [];
    const processedAt = DateUtils.now();

    for (const verificationId of dto.verificationIds) {
      try {
        // Validate ObjectId
        if (!Types.ObjectId.isValid(verificationId)) {
          results.push({
            verificationId,
            success: false,
            error: 'Invalid verification ID format',
          });
          continue;
        }

        const verification = await this.verificationModel.findById(verificationId);

        if (!verification) {
          results.push({
            verificationId,
            success: false,
            error: 'Verification not found',
          });
          continue;
        }

        if (verification.status !== VerificationStatus.PENDING && verification.status !== VerificationStatus.UNDER_REVIEW) {
          results.push({
            verificationId,
            success: false,
            userId: verification.userId.toString(),
            error: `Cannot approve verification with status: ${verification.status}`,
          });
          continue;
        }

        // Update verification status
        verification.status = VerificationStatus.APPROVED;
        verification.reviewedBy = new Types.ObjectId(reviewerId);
        verification.reviewedAt = processedAt;
        verification.verifiedAt = processedAt;
        verification.isActive = true;

        // Add to status history
        verification.statusHistory.push({
          status: VerificationStatus.APPROVED,
          changedAt: processedAt,
          changedBy: new Types.ObjectId(reviewerId),
          comment: dto.comment || 'Bulk approval',
          metadata: { bulkOperation: true },
        });

        await verification.save();

        // Create audit log
        await this.auditLogModel.create({
          userId: new Types.ObjectId(reviewerId),
          action: AuditLogAction.IDENTITY_VERIFICATION_APPROVED,
          result: 'success',
          resourceType: 'IdentityVerification',
          resourceId: (verification._id as Types.ObjectId).toString(),
          ipAddress,
          metadata: {
            verificationId: (verification._id as Types.ObjectId).toString(),
            subjectUserId: verification.userId.toString(),
            documentType: verification.documentType,
            bulkOperation: true,
            comment: dto.comment,
          },
        });

        results.push({
          verificationId,
          success: true,
          userId: verification.userId.toString(),
        });
      } catch (error) {
        results.push({
          verificationId,
          success: false,
          error: error.message || 'Unknown error occurred',
        });
      }
    }

    const successCount = results.filter((r) => r.success).length;
    const failedCount = results.length - successCount;

    return {
      totalProcessed: results.length,
      successCount,
      failedCount,
      results,
      processedAt,
      reviewedBy: reviewerId,
    };
  }

  /**
   * Bulk reject verifications
   */
  async bulkRejectVerifications(
    dto: BulkRejectVerificationsDto,
    reviewerId: string,
    ipAddress?: string,
  ): Promise<BulkOperationResultDto> {
    const results: BulkOperationResultItemDto[] = [];
    const processedAt = DateUtils.now();

    for (const verificationId of dto.verificationIds) {
      try {
        // Validate ObjectId
        if (!Types.ObjectId.isValid(verificationId)) {
          results.push({
            verificationId,
            success: false,
            error: 'Invalid verification ID format',
          });
          continue;
        }

        const verification = await this.verificationModel.findById(verificationId);

        if (!verification) {
          results.push({
            verificationId,
            success: false,
            error: 'Verification not found',
          });
          continue;
        }

        if (verification.status !== VerificationStatus.PENDING && verification.status !== VerificationStatus.UNDER_REVIEW) {
          results.push({
            verificationId,
            success: false,
            userId: verification.userId.toString(),
            error: `Cannot reject verification with status: ${verification.status}`,
          });
          continue;
        }

        // Update verification status
        verification.status = VerificationStatus.REJECTED;
        verification.reviewedBy = new Types.ObjectId(reviewerId);
        verification.reviewedAt = processedAt;
        verification.rejectionReason = dto.rejectionReason;
        verification.rejectionComment = dto.comment;
        verification.isActive = false;

        // Add to status history
        verification.statusHistory.push({
          status: VerificationStatus.REJECTED,
          changedAt: processedAt,
          changedBy: new Types.ObjectId(reviewerId),
          comment: dto.comment,
          metadata: {
            bulkOperation: true,
            rejectionReason: dto.rejectionReason,
          },
        });

        await verification.save();

        // Create audit log
        await this.auditLogModel.create({
          userId: new Types.ObjectId(reviewerId),
          action: AuditLogAction.IDENTITY_VERIFICATION_REJECTED,
          result: 'success',
          resourceType: 'IdentityVerification',
          resourceId: (verification._id as Types.ObjectId).toString(),
          ipAddress,
          metadata: {
            verificationId: (verification._id as Types.ObjectId).toString(),
            subjectUserId: verification.userId.toString(),
            documentType: verification.documentType,
            rejectionReason: dto.rejectionReason,
            bulkOperation: true,
            comment: dto.comment,
          },
        });

        results.push({
          verificationId,
          success: true,
          userId: verification.userId.toString(),
        });
      } catch (error) {
        results.push({
          verificationId,
          success: false,
          error: error.message || 'Unknown error occurred',
        });
      }
    }

    const successCount = results.filter((r) => r.success).length;
    const failedCount = results.length - successCount;

    return {
      totalProcessed: results.length,
      successCount,
      failedCount,
      results,
      processedAt,
      reviewedBy: reviewerId,
    };
  }

  /**
   * Get monthly compliance report
   */
  async getMonthlyReport(month?: string): Promise<MonthlyComplianceReportDto> {
    // Parse month or use current month
    const targetDate = month ? new Date(`${month}-01`) : new Date();
    const year = targetDate.getFullYear();
    const monthNum = targetDate.getMonth();

    const startDate = new Date(year, monthNum, 1);
    const endDate = new Date(year, monthNum + 1, 0, 23, 59, 59, 999);

    const monthStr = `${year}-${String(monthNum + 1).padStart(2, '0')}`;

    // Get all verifications submitted in this month
    const verifications = await this.verificationModel
      .find({
        $or: [
          { submittedAt: { $gte: startDate, $lte: endDate } },
          { createdAt: { $gte: startDate, $lte: endDate }, submittedAt: { $exists: false } },
        ],
      })
      .populate('reviewedBy', 'firstName lastName')
      .lean()
      .exec();

    // Calculate basic stats
    const totalSubmissions = verifications.length;
    const approved = verifications.filter((v) => v.status === VerificationStatus.APPROVED);
    const rejected = verifications.filter((v) => v.status === VerificationStatus.REJECTED);
    const pending = verifications.filter(
      (v) =>
        v.status === VerificationStatus.PENDING || v.status === VerificationStatus.UNDER_REVIEW,
    );

    const totalApproved = approved.length;
    const totalRejected = rejected.length;
    const totalPending = pending.length;

    const reviewedCount = totalApproved + totalRejected;
    const approvalRate = reviewedCount > 0 ? (totalApproved / reviewedCount) * 100 : 0;
    const rejectionRate = reviewedCount > 0 ? (totalRejected / reviewedCount) * 100 : 0;

    // Calculate average review time
    const reviewedVerifications = verifications.filter(
      (v) => v.reviewedAt && (v.submittedAt || v.createdAt),
    );
    const totalReviewTimeMs = reviewedVerifications.reduce((sum, v) => {
      const submittedAt = new Date(v.submittedAt || v.createdAt);
      const reviewedAt = new Date(v.reviewedAt!);
      return sum + (reviewedAt.getTime() - submittedAt.getTime());
    }, 0);
    const avgReviewTimeHours =
      reviewedVerifications.length > 0
        ? totalReviewTimeMs / (1000 * 60 * 60) / reviewedVerifications.length
        : 0;

    // Breakdown by document type
    const byDocumentType: Record<string, any> = {};
    for (const v of verifications) {
      if (!byDocumentType[v.documentType]) {
        byDocumentType[v.documentType] = { total: 0, approved: 0, rejected: 0, pending: 0 };
      }
      byDocumentType[v.documentType].total++;
      if (v.status === VerificationStatus.APPROVED) byDocumentType[v.documentType].approved++;
      if (v.status === VerificationStatus.REJECTED) byDocumentType[v.documentType].rejected++;
      if (v.status === VerificationStatus.PENDING || v.status === VerificationStatus.UNDER_REVIEW)
        byDocumentType[v.documentType].pending++;
    }

    // Breakdown by country
    const byCountry: Record<string, any> = {};
    for (const v of verifications) {
      if (!byCountry[v.issuingCountry]) {
        byCountry[v.issuingCountry] = { total: 0, approved: 0, rejected: 0, pending: 0 };
      }
      byCountry[v.issuingCountry].total++;
      if (v.status === VerificationStatus.APPROVED) byCountry[v.issuingCountry].approved++;
      if (v.status === VerificationStatus.REJECTED) byCountry[v.issuingCountry].rejected++;
      if (v.status === VerificationStatus.PENDING || v.status === VerificationStatus.UNDER_REVIEW)
        byCountry[v.issuingCountry].pending++;
    }

    // Rejection reasons breakdown
    const rejectionReasons: Record<string, number> = {};
    for (const v of rejected) {
      if (v.rejectionReason) {
        rejectionReasons[v.rejectionReason] = (rejectionReasons[v.rejectionReason] || 0) + 1;
      }
    }

    // Top reviewers
    const reviewerStats: Map<string, { count: number; totalReviewTimeMs: number; name: string }> =
      new Map();
    for (const v of reviewedVerifications) {
      if (v.reviewedBy) {
        const reviewedByObj = v.reviewedBy as any;
        const reviewerId =
          typeof reviewedByObj === 'object' && reviewedByObj._id
            ? reviewedByObj._id.toString()
            : reviewedByObj.toString();
        const reviewerName =
          typeof reviewedByObj === 'object' && reviewedByObj.firstName && reviewedByObj.lastName
            ? `${reviewedByObj.firstName} ${reviewedByObj.lastName}`
            : 'Unknown';

        if (!reviewerStats.has(reviewerId)) {
          reviewerStats.set(reviewerId, { count: 0, totalReviewTimeMs: 0, name: reviewerName });
        }

        const stats = reviewerStats.get(reviewerId)!;
        stats.count++;

        const submittedAt = new Date(v.submittedAt || v.createdAt);
        const reviewedAt = new Date(v.reviewedAt!);
        stats.totalReviewTimeMs += reviewedAt.getTime() - submittedAt.getTime();
      }
    }

    const topReviewers = Array.from(reviewerStats.entries())
      .map(([reviewerId, stats]) => ({
        reviewerId,
        reviewerName: stats.name,
        count: stats.count,
        avgReviewTimeHours: stats.totalReviewTimeMs / (1000 * 60 * 60) / stats.count,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Aging buckets
    const now = DateUtils.now();
    const agingBuckets = {
      lessThan24Hours: 0,
      between24And48Hours: 0,
      between2And7Days: 0,
      moreThan7Days: 0,
    };

    for (const v of pending) {
      const submittedAt = new Date(v.submittedAt || v.createdAt);
      const hoursSince = (now.getTime() - submittedAt.getTime()) / (1000 * 60 * 60);

      if (hoursSince < 24) {
        agingBuckets.lessThan24Hours++;
      } else if (hoursSince < 48) {
        agingBuckets.between24And48Hours++;
      } else if (hoursSince < 168) {
        // 7 days
        agingBuckets.between2And7Days++;
      } else {
        agingBuckets.moreThan7Days++;
      }
    }

    return {
      month: monthStr,
      totalSubmissions,
      totalApproved,
      totalRejected,
      totalPending,
      approvalRate: Math.round(approvalRate * 10) / 10,
      rejectionRate: Math.round(rejectionRate * 10) / 10,
      avgReviewTimeHours: Math.round(avgReviewTimeHours * 10) / 10,
      byDocumentType,
      byCountry,
      rejectionReasons,
      topReviewers,
      agingBuckets,
      generatedAt: now,
    };
  }

  /**
   * Get compliance statistics
   */
  async getComplianceStatistics(): Promise<ComplianceStatisticsDto> {
    const now = DateUtils.now();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const twoDaysAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Current pending counts
    const totalPending = await this.verificationModel.countDocuments({
      status: VerificationStatus.PENDING,
      isActive: true,
    });

    const totalUnderReview = await this.verificationModel.countDocuments({
      status: VerificationStatus.UNDER_REVIEW,
      isActive: true,
    });

    const pendingOver24Hours = await this.verificationModel.countDocuments({
      status: { $in: [VerificationStatus.PENDING, VerificationStatus.UNDER_REVIEW] },
      isActive: true,
      $or: [
        { submittedAt: { $lte: oneDayAgo } },
        { createdAt: { $lte: oneDayAgo }, submittedAt: { $exists: false } },
      ],
    });

    const pendingOver48Hours = await this.verificationModel.countDocuments({
      status: { $in: [VerificationStatus.PENDING, VerificationStatus.UNDER_REVIEW] },
      isActive: true,
      $or: [
        { submittedAt: { $lte: twoDaysAgo } },
        { createdAt: { $lte: twoDaysAgo }, submittedAt: { $exists: false } },
      ],
    });

    const pendingOver7Days = await this.verificationModel.countDocuments({
      status: { $in: [VerificationStatus.PENDING, VerificationStatus.UNDER_REVIEW] },
      isActive: true,
      $or: [
        { submittedAt: { $lte: sevenDaysAgo } },
        { createdAt: { $lte: sevenDaysAgo }, submittedAt: { $exists: false } },
      ],
    });

    // Last 30 days stats
    const last30DaysVerifications = await this.verificationModel
      .find({
        reviewedAt: { $gte: thirtyDaysAgo, $lte: now },
      })
      .lean()
      .exec();

    const approvedLast30Days = last30DaysVerifications.filter(
      (v) => v.status === VerificationStatus.APPROVED,
    ).length;
    const rejectedLast30Days = last30DaysVerifications.filter(
      (v) => v.status === VerificationStatus.REJECTED,
    ).length;

    const reviewedCountLast30Days = approvedLast30Days + rejectedLast30Days;
    const approvalRateLast30Days =
      reviewedCountLast30Days > 0 ? (approvedLast30Days / reviewedCountLast30Days) * 100 : 0;

    // Calculate average review time for last 30 days
    const reviewedWithTimes = last30DaysVerifications.filter(
      (v) => v.reviewedAt && (v.submittedAt || v.createdAt),
    );
    const totalReviewTimeMs = reviewedWithTimes.reduce((sum, v) => {
      const submittedAt = new Date(v.submittedAt || v.createdAt);
      const reviewedAt = new Date(v.reviewedAt!);
      return sum + (reviewedAt.getTime() - submittedAt.getTime());
    }, 0);
    const avgReviewTimeHours =
      reviewedWithTimes.length > 0
        ? totalReviewTimeMs / (1000 * 60 * 60) / reviewedWithTimes.length
        : 0;

    // Items requiring immediate attention (pending > 48 hours OR high risk score)
    const requiresImmediateAttention = await this.verificationModel.countDocuments({
      status: { $in: [VerificationStatus.PENDING, VerificationStatus.UNDER_REVIEW] },
      isActive: true,
      $or: [
        { submittedAt: { $lte: twoDaysAgo } },
        { createdAt: { $lte: twoDaysAgo }, submittedAt: { $exists: false } },
        { 'metadata.fraudDetection.riskScore': { $gte: 0.7 } },
      ],
    });

    return {
      totalPending,
      totalUnderReview,
      pendingOver24Hours,
      pendingOver48Hours,
      pendingOver7Days,
      avgReviewTimeHours: Math.round(avgReviewTimeHours * 10) / 10,
      approvalRateLast30Days: Math.round(approvalRateLast30Days * 10) / 10,
      approvedLast30Days,
      rejectedLast30Days,
      requiresImmediateAttention,
      generatedAt: now,
    };
  }
}
