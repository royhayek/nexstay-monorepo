import { Injectable } from '@nestjs/common';
import { DateUtils } from '../../../common/utils/date.utils';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Property, PropertyDocument } from '../../../database/schemas/property.schema';
import { PropertyStatus, ModerationStatus } from '../../../common/enums/property.enums';
import { PAGINATION_CONSTANTS, validatePagination } from '../constants/pagination.constants';
import { LoggingUtil } from '../../../common/utils/logging.util';
import { ValidationUtils } from '../../../common/utils/validation.utils';

/**
 * Property Admin Service
 * Handles admin-specific property operations
 */
@Injectable()
export class PropertyAdminService {
  constructor(
    @InjectModel(Property.name)
    private readonly propertyModel: Model<PropertyDocument>,
  ) {}

  /**
   * Get all properties for admin with filters
   */
  async getAllForAdmin(
    page: number = PAGINATION_CONSTANTS.DEFAULT_PAGE,
    limit: number = PAGINATION_CONSTANTS.ADMIN_DEFAULT_LIMIT,
    filters?: {
      status?: PropertyStatus;
      featured?: boolean;
      verified?: boolean;
      hostId?: string;
    },
  ): Promise<{ items: PropertyDocument[]; total: number }> {
    try {
      interface PropertyAdminQuery {
        status?: PropertyStatus;
        isActive?: boolean;
        isFeatured?: boolean;
        isVerified?: boolean;
        hostId?: string;
      }
      const query: PropertyAdminQuery = {};

      // Apply filters
      if (filters?.status && filters.status !== PropertyStatus.ALL) {
        query.status = filters.status;
      }
      if (filters?.featured !== undefined) {
        query.isFeatured = filters.featured;
      }
      if (filters?.verified !== undefined) {
        query.isVerified = filters.verified;
      }
      if (filters?.hostId) {
        try {
          ValidationUtils.validateObjectId(filters.hostId, 'hostId', {
            context: 'PropertyAdminService',
          });
          query.hostId = filters.hostId;
        } catch (error) {
          LoggingUtil.errorWithException(
            `Invalid hostId filter: ${filters.hostId}`,
            error,
            'PropertyAdminService',
          );
        }
      }

      const { page: validatedPage, limit: validatedLimit } = validatePagination(page, limit);
      const skip = (validatedPage - 1) * validatedLimit;

      const [items, total] = await Promise.all([
        this.propertyModel
          .find(query)
          .populate('host', 'firstName lastName email role isActive')
          .populate('amenities')
          .skip(skip)
          .limit(validatedLimit)
          .sort({ createdAt: -1 })
          .exec(),
        this.propertyModel.countDocuments(query),
      ]);

      return { items, total };
    } catch (error) {
      LoggingUtil.errorWithException(
        'Failed to get properties for admin',
        error,
        'PropertyAdminService',
      );
      throw new Error('INTERNAL_SERVER_ERROR');
    }
  }

  /**
   * Toggle property featured status
   */
  async toggleFeatured(propertyId: string): Promise<PropertyDocument> {
    ValidationUtils.validateObjectId(propertyId, 'propertyId', {
      context: 'PropertyAdminService',
    });

    const property = await this.propertyModel.findById(propertyId);
    ValidationUtils.validateEntityExists(property, propertyId, {
      entityName: 'Property',
      context: 'PropertyAdminService',
    });

    property!.isFeatured = !property!.isFeatured;
    return await property!.save();
  }

  /**
   * Toggle property verification status
   */
  async toggleVerified(propertyId: string): Promise<PropertyDocument> {
    ValidationUtils.validateObjectId(propertyId, 'propertyId', {
      context: 'PropertyAdminService',
    });

    const property = await this.propertyModel.findById(propertyId);
    ValidationUtils.validateEntityExists(property, propertyId, {
      entityName: 'Property',
      context: 'PropertyAdminService',
    });

    property!.isVerified = !property!.isVerified;
    property!.verifiedAt = property!.isVerified ? DateUtils.now() : undefined;
    return await property!.save();
  }

  /**
   * Bulk update property status
   */
  async bulkUpdateStatus(
    propertyIds: string[],
    isActive: boolean,
  ): Promise<{ modifiedCount: number }> {
    const validIds: string[] = [];

    for (const id of propertyIds) {
      try {
        ValidationUtils.validateObjectId(id, 'propertyId', {
          context: 'PropertyAdminService',
        });
        validIds.push(id);
      } catch (error) {
        LoggingUtil.errorWithException(
          `Invalid propertyId skipped: ${id}`,
          error,
          'PropertyAdminService',
        );
      }
    }

    if (validIds.length === 0) {
      throw new Error('VALIDATION_FAILED');
    }

    const result = await this.propertyModel.updateMany(
      { _id: { $in: validIds } },
      { isActive, updatedAt: DateUtils.now() },
    );

    return { modifiedCount: result.modifiedCount };
  }

  /**
   * Bulk delete properties
   */
  async bulkDelete(propertyIds: string[]): Promise<{ deletedCount: number }> {
    const validIds: string[] = [];

    for (const id of propertyIds) {
      try {
        ValidationUtils.validateObjectId(id, 'propertyId', {
          context: 'PropertyAdminService',
        });
        validIds.push(id);
      } catch (error) {
        LoggingUtil.errorWithException(
          `Invalid propertyId skipped: ${id}`,
          error,
          'PropertyAdminService',
        );
      }
    }

    if (validIds.length === 0) {
      throw new Error('VALIDATION_FAILED');
    }

    const result = await this.propertyModel.deleteMany({ _id: { $in: validIds } });
    return { deletedCount: result.deletedCount };
  }

  /**
   * Get property statistics for admin dashboard
   */
  async getAdminStatistics(): Promise<{
    total: number;
    active: number;
    inactive: number;
    featured: number;
    verified: number;
    unverified: number;
    byType: { type: string; count: number }[];
    byCountry: { country: string; count: number }[];
  }> {
    try {
      const [total, active, featured, verified, typeStats, countryStats] = await Promise.all([
        this.propertyModel.countDocuments(),
        this.propertyModel.countDocuments({ isActive: true }),
        this.propertyModel.countDocuments({ isFeatured: true }),
        this.propertyModel.countDocuments({ isVerified: true }),
        this.propertyModel.aggregate<{ type: string; count: number }>([
          { $group: { _id: '$propertyType', count: { $sum: 1 } } },
          { $project: { type: '$_id', count: 1, _id: 0 } },
        ]),
        this.propertyModel.aggregate<{ country: string; count: number }>([
          { $group: { _id: '$address.country', count: { $sum: 1 } } },
          { $project: { country: '$_id', count: 1, _id: 0 } },
          { $sort: { count: -1 } },
          { $limit: PAGINATION_CONSTANTS.FEATURED_DEFAULT_LIMIT },
        ]),
      ]);

      return {
        total,
        active,
        inactive: total - active,
        featured,
        verified,
        unverified: total - verified,
        byType: typeStats,
        byCountry: countryStats,
      };
    } catch (error) {
      LoggingUtil.errorWithException(
        'Failed to get admin statistics',
        error,
        'PropertyAdminService',
      );
      throw new Error('INTERNAL_SERVER_ERROR');
    }
  }

  /**
   * Get flagged properties (for moderation)
   */
  async getFlaggedProperties(
    limit: number = PAGINATION_CONSTANTS.FLAGGED_DEFAULT_LIMIT,
  ): Promise<PropertyDocument[]> {
    try {
      return await this.propertyModel
        .find({
          $or: [{ isFlagged: true }, { reportCount: { $gte: 3 } }, { rating: { $lte: 2 } }],
        })
        .populate('host', 'firstName lastName email')
        .sort({ reportCount: -1, rating: 1 })
        .limit(limit)
        .exec();
    } catch (error) {
      LoggingUtil.errorWithException(
        'Failed to get flagged properties',
        error,
        'PropertyAdminService',
      );
      throw new Error('INTERNAL_SERVER_ERROR');
    }
  }

  /**
   * Update property moderation status
   */
  async updateModerationStatus(
    propertyId: string,
    status: ModerationStatus,
    reason?: string,
  ): Promise<PropertyDocument> {
    ValidationUtils.validateObjectId(propertyId, 'propertyId', {
      context: 'PropertyAdminService',
    });

    interface ModerationUpdateData {
      moderationStatus: string;
      moderatedAt: Date;
      moderationReason?: string;
      isVerified?: boolean;
      verifiedAt?: Date;
      isActive?: boolean;
    }

    const updateData: ModerationUpdateData = {
      moderationStatus: status,
      moderatedAt: DateUtils.now(),
    };

    if (reason) {
      updateData.moderationReason = reason;
    }

    if (status === ModerationStatus.APPROVED) {
      updateData.isVerified = true;
      updateData.verifiedAt = DateUtils.now();
    } else if (status === ModerationStatus.REJECTED) {
      updateData.isActive = false;
    }

    const property = await this.propertyModel.findByIdAndUpdate(propertyId, updateData, {
      new: true,
    });

    ValidationUtils.validateEntityExists(property, propertyId, {
      entityName: 'Property',
      context: 'PropertyAdminService',
    });

    return property!;
  }
}
