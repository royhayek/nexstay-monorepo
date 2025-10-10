import { Injectable } from '@nestjs/common';
import { DateUtils } from '../../../common/utils/date.utils';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Property, PropertyDocument } from '../../../database/schemas/property.schema';
import { InternalCreatePropertyDto } from '../dto/internal-property.dto';
import { UpdatePropertyDto } from '../dto/update-property.dto';
import { PaginatedDto } from '../../../common/dto/paginated.dto';
import { PAGINATION_CONSTANTS, validatePagination } from '../constants/pagination.constants';
import { PropertyStatus } from '../../../common/enums/property.enums';
import { LoggingUtil } from '../../../common/utils/logging.util';
import { ValidationUtils } from '../../../common/utils/validation.utils';

/**
 * Property Core Service
 * Handles basic CRUD operations for properties
 */
@Injectable()
export class PropertyCoreService {
  constructor(
    @InjectModel(Property.name)
    private readonly propertyModel: Model<PropertyDocument>,
  ) {}

  /**
   * Create a new property
   */
  async create(createPropertyDto: InternalCreatePropertyDto): Promise<PropertyDocument> {
    try {
      // Map ownerId to host field as expected by the schema
      const { ownerId, ...propertyData } = createPropertyDto;
      const property = new this.propertyModel({
        ...propertyData,
        hostId: ownerId,
      });
      return await property.save();
    } catch (error) {
      LoggingUtil.errorWithException('Failed to create property', error, 'PropertyCoreService');
      if (error instanceof Error && error.message.includes('duplicate')) {
        throw new Error('DUPLICATE_RESOURCE');
      }
      throw new Error('INTERNAL_SERVER_ERROR');
    }
  }

  /**
   * Find property by ID
   */
  async findById(id: string): Promise<PropertyDocument> {
    ValidationUtils.validateObjectId(id, 'propertyId', {
      context: 'PropertyCoreService',
    });

    const property = await this.propertyModel
      .findById(id)
      .populate({
        path: 'host',
        select:
          'firstName lastName email avatarUrl bio reviewCount averageRating isEmailVerified isPhoneVerified isIdentityVerified createdAt locale roles',
      })
      .populate('amenities')
      .exec();

    ValidationUtils.validateEntityExists(property, id, {
      entityName: 'Property',
      context: 'PropertyCoreService',
    });

    return property!;
  }

  /**
   * Find all properties with pagination
   */
  async findAll(
    page: number = PAGINATION_CONSTANTS.DEFAULT_PAGE,
    limit: number = PAGINATION_CONSTANTS.SEARCH_DEFAULT_LIMIT,
  ): Promise<PaginatedDto<PropertyDocument>> {
    const { page: validatedPage, limit: validatedLimit } = validatePagination(page, limit);
    const skip = (validatedPage - 1) * validatedLimit;

    // Define filter criteria for publicly visible properties
    const publicFilter = {
      isActive: true,
      status: PropertyStatus.PUBLISHED,
      isListed: true,
    };

    const [items, total] = await Promise.all([
      this.propertyModel
        .find(publicFilter)
        .populate(
          'host',
          'firstName lastName email avatarUrl bio reviewCount averageRating isEmailVerified isPhoneVerified isIdentityVerified createdAt locale roles',
        )
        .populate('amenities')
        .skip(skip)
        .limit(validatedLimit)
        .sort({ createdAt: -1 })
        .exec(),
      this.propertyModel.countDocuments(publicFilter),
    ]);

    const totalPages = Math.ceil(total / validatedLimit);

    return {
      items,
      total,
      page: validatedPage,
      limit: validatedLimit,
      totalPages,
      hasNextPage: validatedPage < totalPages,
      hasPrevPage: validatedPage > 1,
    };
  }

  /**
   * Find properties by user ID
   */
  async findByUserId(userId: string): Promise<PropertyDocument[]> {
    ValidationUtils.validateObjectId(userId, 'userId', {
      context: 'PropertyCoreService',
    });

    return await this.propertyModel
      .find({ hostId: userId })
      .populate('amenities')
      .sort({ createdAt: -1 })
      .exec();
  }

  /**
   * Update property by ID
   */
  async update(id: string, updatePropertyDto: UpdatePropertyDto): Promise<PropertyDocument> {
    ValidationUtils.validateObjectId(id, 'propertyId', {
      context: 'PropertyCoreService',
    });

    const property = await this.propertyModel
      .findByIdAndUpdate(id, updatePropertyDto, { new: true, runValidators: true })
      .populate(
        'host',
        'firstName lastName email avatarUrl bio reviewCount averageRating isEmailVerified isPhoneVerified isIdentityVerified createdAt locale',
      )
      .populate('amenities')
      .exec();

    ValidationUtils.validateEntityExists(property, id, {
      entityName: 'Property',
      context: 'PropertyCoreService',
    });

    return property!;
  }

  /**
   * Delete property (soft delete)
   */
  async delete(id: string): Promise<PropertyDocument> {
    ValidationUtils.validateObjectId(id, 'propertyId', {
      context: 'PropertyCoreService',
    });

    const property = await this.propertyModel
      .findByIdAndUpdate(
        id,
        {
          status: PropertyStatus.DELETED,
          isActive: false, // Keep for backward compatibility during transition
          deletedAt: DateUtils.now(),
        },
        { new: true },
      )
      .exec();

    ValidationUtils.validateEntityExists(property, id, {
      entityName: 'Property',
      context: 'PropertyCoreService',
    });

    return property!;
  }

  /**
   * Hard delete property (permanent)
   */
  async hardDelete(id: string): Promise<void> {
    ValidationUtils.validateObjectId(id, 'propertyId', {
      context: 'PropertyCoreService',
    });

    const result = await this.propertyModel.findByIdAndDelete(id).exec();

    ValidationUtils.validateEntityExists(result, id, {
      entityName: 'Property',
      context: 'PropertyCoreService',
    });
  }

  /**
   * Check if user owns property
   */
  async verifyOwnership(propertyId: string, userId: string): Promise<boolean> {
    try {
      ValidationUtils.validateObjectId(propertyId, 'propertyId', {
        context: 'PropertyCoreService',
      });
      ValidationUtils.validateObjectId(userId, 'userId', {
        context: 'PropertyCoreService',
      });
    } catch (error) {
      LoggingUtil.errorWithException(
        'Invalid propertyId or userId in verifyOwnership',
        error,
        'PropertyCoreService',
      );
      return false;
    }

    const property = await this.propertyModel.findOne({
      _id: propertyId,
      hostId: userId,
    });

    return !!property;
  }

  /**
   * Update property status (unified status system)
   */
  async updateStatus(id: string, status: PropertyStatus): Promise<PropertyDocument> {
    ValidationUtils.validateObjectId(id, 'propertyId', {
      context: 'PropertyCoreService',
    });

    // First, check if the property exists and get its current status
    const existingProperty = await this.propertyModel.findById(id).exec();

    ValidationUtils.validateEntityExists(existingProperty, id, {
      entityName: 'Property',
      context: 'PropertyCoreService',
    });

    // Prevent status updates on deleted properties
    if (existingProperty!.status === PropertyStatus.DELETED) {
      throw new Error('PROPERTY_DELETED');
    }

    // Map status to legacy fields for backward compatibility
    const isActive = status === PropertyStatus.PUBLISHED;
    const isListed = status === PropertyStatus.PUBLISHED;

    const property = await this.propertyModel
      .findByIdAndUpdate(
        id,
        {
          status,
          isActive,
          isListed,
          // Clear deletedAt if not deleted
          ...(status !== PropertyStatus.DELETED && { $unset: { deletedAt: 1 } }),
        },
        { new: true },
      )
      .exec();

    ValidationUtils.validateEntityExists(property, id, {
      entityName: 'Property',
      context: 'PropertyCoreService',
    });

    return property!;
  }

  /**
   * Publish property (set status to published)
   */
  async publish(id: string): Promise<PropertyDocument> {
    return this.updateStatus(id, PropertyStatus.PUBLISHED);
  }

  /**
   * Unpublish property (set status to draft)
   */
  async unpublish(id: string): Promise<PropertyDocument> {
    return this.updateStatus(id, PropertyStatus.DRAFT);
  }

  /**
   * Suspend property
   */
  async suspend(id: string): Promise<PropertyDocument> {
    return this.updateStatus(id, PropertyStatus.SUSPENDED);
  }
}
