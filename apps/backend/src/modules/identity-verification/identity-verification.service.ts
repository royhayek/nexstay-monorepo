import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { QueryBuilder } from '../../common/utils/query-builder.util';
import { validatePagination, buildPaginatedResult } from '../../common/utils/database.utils';
import { DateUtils } from '../../common/utils/date.utils';
import {
  IdentityVerification,
  IdentityVerificationDocument,
  VerificationStatus,
  DocumentType,
} from '../../database/schemas/identity-verification.schema';
import { User, UserDocument } from '../../database/schemas/user.schema';
import { UserStatus } from '../../common/enums/user-status.enums';
import {
  getDocumentTypeInfo,
  getSupportedDocumentTypes,
  isTerminalStatus,
} from '../../common/enums/identity-verification.enums';
import { S3Service, FileCategory } from '../storage/services/s3.service';
import { CreateIdentityVerificationDto } from './dto/create-identity-verification.dto';
import { UpdateVerificationStatusDto } from './dto/update-verification-status.dto';
import { IdentityVerificationFilters } from './interfaces/identity-verification.interfaces';
import { LoggingUtil } from '../../common/utils/logging.util';

@Injectable()
export class IdentityVerificationService {
  private readonly MAX_VERIFICATION_ATTEMPTS = 3;
  private readonly VERIFICATION_EXPIRY_DAYS = 365; // 1 year

  constructor(
    @InjectModel(IdentityVerification.name)
    private readonly verificationModel: Model<IdentityVerificationDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    private readonly s3Service: S3Service,
  ) {}

  async createVerification(
    userId: string,
    createDto: CreateIdentityVerificationDto,
    files: {
      documentFront: Express.Multer.File;
      documentBack?: Express.Multer.File;
      selfie?: Express.Multer.File;
      proofOfAddress?: Express.Multer.File;
    },
    metadata: {
      ipAddress?: string;
      userAgent?: string;
      geolocation?: {
        country?: string;
        region?: string;
        city?: string;
      };
    } = {},
  ): Promise<IdentityVerificationDocument> {
    LoggingUtil.log(
      `Creating identity verification for user: ${userId}`,
      'IdentityVerificationService',
    );

    // Check if user exists and validate status
    const user = await this.userModel.findById(userId).exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if there's an active verification
    const existingVerification = await this.verificationModel
      .findOne({
        userId: new Types.ObjectId(userId),
        isActive: true,
        status: { $in: [VerificationStatus.PENDING, VerificationStatus.UNDER_REVIEW] },
      })
      .exec();

    if (existingVerification) {
      throw new BadRequestException(
        'You already have a pending verification. Please wait for review or cancel the current one.',
      );
    }

    // Check verification attempts
    const attemptCount = await this.verificationModel
      .countDocuments({ userId: new Types.ObjectId(userId) })
      .exec();

    if (attemptCount >= this.MAX_VERIFICATION_ATTEMPTS) {
      throw new ForbiddenException(
        'Maximum verification attempts exceeded. Please contact support.',
      );
    }

    // Validate document type support
    const supportedTypes = getSupportedDocumentTypes(createDto.issuingCountry);
    if (!supportedTypes.includes(createDto.documentType)) {
      throw new BadRequestException(
        `Document type ${createDto.documentType} is not supported for country ${createDto.issuingCountry}`,
      );
    }

    // Validate document expiration
    if (!DateUtils.isFuture(createDto.expirationDate)) {
      throw new BadRequestException('Document has expired');
    }

    // Check if document back is required
    const documentTypeInfo = getDocumentTypeInfo(createDto.documentType);
    if (documentTypeInfo.requiresBackImage && !files.documentBack) {
      throw new BadRequestException(
        `Back image is required for document type: ${createDto.documentType}`,
      );
    }

    try {
      // Upload files to S3
      const documentFrontResult = await this.s3Service.uploadFile(
        files.documentFront.buffer,
        `verification_${userId}_front_${DateUtils.now().getTime()}.${this.getFileExtension(files.documentFront.mimetype)}`,
        files.documentFront.mimetype,
        FileCategory.DOCUMENTS,
        userId,
        false, // Don't process images for documents
      );
      const documentFrontUrl = documentFrontResult.url;

      let documentBackUrl: string | undefined;
      if (files.documentBack) {
        const documentBackResult = await this.s3Service.uploadFile(
          files.documentBack.buffer,
          `verification_${userId}_back_${DateUtils.now().getTime()}.${this.getFileExtension(files.documentBack.mimetype)}`,
          files.documentBack.mimetype,
          FileCategory.DOCUMENTS,
          userId,
          false,
        );
        documentBackUrl = documentBackResult.url;
      }

      let selfieUrl: string | undefined;
      if (files.selfie) {
        const selfieResult = await this.s3Service.uploadFile(
          files.selfie.buffer,
          `verification_${userId}_selfie_${DateUtils.now().getTime()}.${this.getFileExtension(files.selfie.mimetype)}`,
          files.selfie.mimetype,
          FileCategory.DOCUMENTS,
          userId,
          false,
        );
        selfieUrl = selfieResult.url;
      }

      let proofOfAddressUrl: string | undefined;
      if (files.proofOfAddress) {
        const proofOfAddressResult = await this.s3Service.uploadFile(
          files.proofOfAddress.buffer,
          `verification_${userId}_address_${DateUtils.now().getTime()}.${this.getFileExtension(files.proofOfAddress.mimetype)}`,
          files.proofOfAddress.mimetype,
          FileCategory.DOCUMENTS,
          userId,
          false,
        );
        proofOfAddressUrl = proofOfAddressResult.url;
      }

      // Create verification record
      const verification = new this.verificationModel({
        userId: new Types.ObjectId(userId),
        status: VerificationStatus.PENDING,
        documentType: createDto.documentType,
        documentNumber: createDto.documentNumber,
        issuingCountry: createDto.issuingCountry,
        issuingState: createDto.issuingState,
        expirationDate: createDto.expirationDate,
        firstName: createDto.firstName,
        lastName: createDto.lastName,
        middleName: createDto.middleName,
        dateOfBirth: createDto.dateOfBirth,
        placeOfBirth: createDto.placeOfBirth,
        nationality: createDto.nationality,
        gender: createDto.gender,
        documentFrontImageUrl: documentFrontUrl,
        documentBackImageUrl: documentBackUrl,
        selfieImageUrl: selfieUrl,
        proofOfAddressImageUrl: proofOfAddressUrl,
        submittedAt: DateUtils.now(),
        attemptCount: attemptCount + 1,
        isActive: true,
        expiresAt: DateUtils.addDays(DateUtils.now(), this.VERIFICATION_EXPIRY_DAYS),
        metadata,
        statusHistory: [
          {
            status: VerificationStatus.PENDING,
            changedAt: DateUtils.now(),
            comment: 'Initial verification submission',
            metadata,
          },
        ],
      });

      const savedVerification = await verification.save();

      // Update user status to pending verification if not already verified
      if (user.status === UserStatus.PENDING_VERIFICATION) {
        // Keep the same status but update timestamp
        user.updatedAt = DateUtils.now();
        await user.save();
      }

      LoggingUtil.log(
        `Identity verification created successfully for user: ${userId}`,
        'IdentityVerificationService',
      );
      return savedVerification;
    } catch (error) {
      LoggingUtil.error(
        `Failed to create identity verification: ${(error as Error).message}`,
        (error as Error).stack,
        'IdentityVerificationService',
      );
      throw new InternalServerErrorException('Failed to create identity verification');
    }
  }

  async getVerificationByUserId(userId: string): Promise<IdentityVerificationDocument | null> {
    return this.verificationModel
      .findOne({
        userId: new Types.ObjectId(userId),
        isActive: true,
      })
      .sort({ createdAt: -1 })
      .exec();
  }

  async getVerificationById(verificationId: string): Promise<IdentityVerificationDocument> {
    const verification = await this.verificationModel.findById(verificationId).exec();
    if (!verification) {
      throw new NotFoundException('Identity verification not found');
    }
    return verification;
  }

  async updateVerificationStatus(
    verificationId: string,
    updateDto: UpdateVerificationStatusDto,
    reviewerId: string,
  ): Promise<IdentityVerificationDocument> {
    LoggingUtil.log(
      `Updating verification status: ${verificationId} to ${updateDto.status}`,
      'IdentityVerificationService',
    );

    const verification = await this.getVerificationById(verificationId);
    const currentStatus = verification.status;

    // Validate status transition
    if (currentStatus === updateDto.status) {
      throw new BadRequestException('Verification is already in this status');
    }

    if (isTerminalStatus(currentStatus)) {
      throw new BadRequestException(`Cannot change status from terminal state: ${currentStatus}`);
    }

    // Validate rejection requirements
    if (
      updateDto.status === VerificationStatus.REJECTED &&
      (!updateDto.rejectionReason || !updateDto.comment)
    ) {
      throw new BadRequestException(
        'Rejection reason and comment are required for rejected status',
      );
    }

    try {
      // Update verification
      verification.status = updateDto.status;
      verification.reviewedAt = DateUtils.now();
      verification.reviewedBy = new Types.ObjectId(reviewerId);

      if (updateDto.status === VerificationStatus.REJECTED) {
        verification.rejectionReason = updateDto.rejectionReason;
        verification.rejectionComment = updateDto.comment;
      } else if (updateDto.status === VerificationStatus.APPROVED) {
        verification.verifiedAt = DateUtils.now();
      }

      // Add to status history
      verification.statusHistory.push({
        status: updateDto.status,
        changedAt: DateUtils.now(),
        changedBy: new Types.ObjectId(reviewerId),
        comment: updateDto.comment,
        metadata: updateDto.metadata,
      });

      const updatedVerification = await verification.save();

      // Update user status based on verification result
      if (updateDto.status === VerificationStatus.APPROVED) {
        await this.userModel
          .findByIdAndUpdate(verification.userId, {
            status: UserStatus.ACTIVE,
            isIdentityVerified: true,
            identityVerifiedAt: DateUtils.now(),
            updatedAt: DateUtils.now(),
          })
          .exec();
        LoggingUtil.log(
          `User ${verification.userId.toString()} status updated to ACTIVE after verification`,
          'IdentityVerificationService',
        );
      } else if (
        updateDto.status === VerificationStatus.REJECTED ||
        updateDto.status === VerificationStatus.EXPIRED
      ) {
        // Reset verification status if rejected or expired
        await this.userModel
          .findByIdAndUpdate(verification.userId, {
            status: UserStatus.PENDING_VERIFICATION,
            isIdentityVerified: false,
            identityVerifiedAt: undefined,
            updatedAt: DateUtils.now(),
          })
          .exec();
        LoggingUtil.log(
          `User ${verification.userId.toString()} status reset to PENDING_VERIFICATION after ${updateDto.status}`,
          'IdentityVerificationService',
        );
      }

      LoggingUtil.log(
        `Verification status updated successfully: ${verificationId} to ${updateDto.status}`,
        'IdentityVerificationService',
      );
      return updatedVerification;
    } catch (error) {
      LoggingUtil.error(
        `Failed to update verification status: ${(error as Error).message}`,
        (error as Error).stack,
        'IdentityVerificationService',
      );
      throw new InternalServerErrorException('Failed to update verification status');
    }
  }

  async listVerifications(
    filters: IdentityVerificationFilters = {},
    page = 1,
    limit = 20,
  ): Promise<{
    verifications: IdentityVerificationDocument[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const {
      page: validPage,
      limit: validLimit,
      skip,
    } = validatePagination({
      page,
      limit,
      maxLimit: 100,
    });

    // Build query using QueryBuilder
    const query = QueryBuilder.create()
      .addEnumFilter('status', filters.status)
      .addEnumFilter('documentType', filters.documentType)
      .addStringFilter('issuingCountry', filters.issuingCountry)
      .addObjectIdFilter('userId', filters.userId)
      .addObjectIdFilter('reviewedBy', filters.reviewerId)
      .addBooleanFilter('isActive', filters.isActive)
      .addDateRangeFilter('createdAt', filters.dateFrom, filters.dateTo)
      .build();

    const [verifications, total] = await Promise.all([
      this.verificationModel
        .find(query)
        .populate('user', 'firstName lastName email')
        .populate('reviewer', 'firstName lastName email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(validLimit)
        .exec(),
      this.verificationModel.countDocuments(query).exec(),
    ]);

    const paginationResult = buildPaginatedResult(verifications, total, validPage, validLimit);

    return {
      verifications: paginationResult.data,
      total: paginationResult.total,
      page: paginationResult.page,
      limit: paginationResult.limit,
      totalPages: paginationResult.totalPages,
    };
  }

  async cancelVerification(
    verificationId: string,
    userId: string,
    reason?: string,
  ): Promise<IdentityVerificationDocument> {
    const verification = await this.getVerificationById(verificationId);

    // Validate ownership
    if (verification.userId.toString() !== userId) {
      throw new ForbiddenException('You can only cancel your own verifications');
    }

    // Check if cancellable
    if (isTerminalStatus(verification.status)) {
      throw new BadRequestException('Cannot cancel a verification in terminal status');
    }

    verification.isActive = false;
    verification.statusHistory.push({
      status: verification.status,
      changedAt: DateUtils.now(),
      changedBy: new Types.ObjectId(userId),
      comment: `Cancelled by user: ${reason || 'No reason provided'}`,
    });

    return verification.save();
  }

  async getVerificationStats(): Promise<{
    total: number;
    pending: number;
    underReview: number;
    approved: number;
    rejected: number;
    expired: number;
    averageProcessingTime: number;
  }> {
    interface StatsResult {
      _id: VerificationStatus;
      count: number;
      avgProcessingTime?: number;
    }

    const stats = (await this.verificationModel
      .aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            avgProcessingTime: {
              $avg: {
                $cond: [
                  { $and: [{ $ne: ['$submittedAt', null] }, { $ne: ['$reviewedAt', null] }] },
                  { $subtract: ['$reviewedAt', '$submittedAt'] },
                  null,
                ],
              },
            },
          },
        },
      ])
      .exec()) as StatsResult[];

    const result = {
      total: 0,
      pending: 0,
      underReview: 0,
      approved: 0,
      rejected: 0,
      expired: 0,
      averageProcessingTime: 0,
    };

    let totalProcessingTime = 0;
    let processedCount = 0;

    stats.forEach((stat: StatsResult) => {
      const status = stat._id;
      const count = stat.count;

      result.total += count;

      switch (status) {
        case VerificationStatus.PENDING:
          result.pending = count;
          break;
        case VerificationStatus.UNDER_REVIEW:
          result.underReview = count;
          break;
        case VerificationStatus.APPROVED:
          result.approved = count;
          break;
        case VerificationStatus.REJECTED:
          result.rejected = count;
          break;
        case VerificationStatus.EXPIRED:
          result.expired = count;
          break;
      }

      if (stat.avgProcessingTime) {
        totalProcessingTime += stat.avgProcessingTime * count;
        processedCount += count;
      }
    });

    result.averageProcessingTime = processedCount > 0 ? totalProcessingTime / processedCount : 0;

    return result;
  }

  async expireVerifications(): Promise<number> {
    LoggingUtil.log('Running verification expiration check', 'IdentityVerificationService');

    // Find expired verifications first to get user IDs
    const expiredVerifications = await this.verificationModel
      .find({
        status: VerificationStatus.APPROVED,
        expiresAt: { $lte: DateUtils.now() },
        isActive: true,
      })
      .select('userId')
      .exec();

    if (expiredVerifications.length === 0) {
      return 0;
    }

    // Update verification records
    const result = await this.verificationModel
      .updateMany(
        {
          status: VerificationStatus.APPROVED,
          expiresAt: { $lte: DateUtils.now() },
          isActive: true,
        },
        {
          $set: { status: VerificationStatus.EXPIRED },
          $push: {
            statusHistory: {
              status: VerificationStatus.EXPIRED,
              changedAt: DateUtils.now(),
              comment: 'Automatically expired by system',
            },
          },
        },
      )
      .exec();

    // Update user verification status for expired verifications
    if (result.modifiedCount > 0) {
      const userIds = expiredVerifications.map((v) => v.userId);
      await this.userModel
        .updateMany(
          { _id: { $in: userIds } },
          {
            $set: {
              status: UserStatus.PENDING_VERIFICATION,
              isIdentityVerified: false,
              identityVerifiedAt: undefined,
              updatedAt: DateUtils.now(),
            },
          },
        )
        .exec();

      LoggingUtil.log(
        `Expired ${result.modifiedCount} verifications and updated user status`,
        'IdentityVerificationService',
      );
    }

    return result.modifiedCount;
  }

  getSupportedDocumentTypes(country?: string): DocumentType[] {
    return getSupportedDocumentTypes(country);
  }

  private getFileExtension(mimetype: string): string {
    const mimeToExtension: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/jpg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp',
      'application/pdf': 'pdf',
    };
    return mimeToExtension[mimetype] || 'bin';
  }
}
