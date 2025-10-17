import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { DateUtils } from '../../../common/utils/date.utils';
import { FlexibleDatesUtil } from '../../../common/utils/flexible-dates.util';
import { Property, PropertyDocument } from '../../../database/schemas/property.schema';
import { PropertySearchDto } from '../dto/property-search.dto';
import { MongoQuery } from '../types/property-query.interface';
import { PaginatedDto } from '../../../common/dto/paginated.dto';
import {
  PAGINATION_CONSTANTS,
  PROPERTY_LIMITS,
  validatePagination,
} from '../constants/pagination.constants';
import { LoggingUtil } from '../../../common/utils/logging.util';

/**
 * Property Search Service
 * Handles advanced search, filtering, and sorting operations
 */
@Injectable()
export class PropertySearchService {
  constructor(
    @InjectModel(Property.name)
    private readonly propertyModel: Model<PropertyDocument>,
  ) {}

  /**
   * Search properties with filters
   */
  async search(searchDto: PropertySearchDto): Promise<PaginatedDto<PropertyDocument>> {
    try {
      const query = this.buildSearchQuery(searchDto);
      const sort = this.buildSortQuery(searchDto.sortBy, searchDto.sortOrder);
      const { page: validatedPage, limit: validatedLimit } = validatePagination(
        searchDto.page,
        searchDto.limit,
        PROPERTY_LIMITS.SEARCH.MAX,
      );
      const skip = (validatedPage - 1) * validatedLimit;

      const [items, total] = await Promise.all([
        this.propertyModel
          .find(query)
          .populate('host', 'firstName lastName email avatar rating')
          .populate('amenities')
          .sort(sort)
          .skip(skip)
          .limit(validatedLimit)
          .exec(),
        this.propertyModel.countDocuments(query),
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
    } catch (error) {
      LoggingUtil.errorWithException('Search failed', error, 'PropertySearchService');
      throw new Error('INTERNAL_SERVER_ERROR');
    }
  }

  /**
   * Search properties by location
   */
  async searchByLocation(
    latitude: number,
    longitude: number,
    radiusInKm: number = PAGINATION_CONSTANTS.NEARBY_DEFAULT_LIMIT || 10,
    limit: number = PAGINATION_CONSTANTS.DEFAULT_LIMIT,
  ): Promise<PropertyDocument[]> {
    try {
      const radiusInRadians = radiusInKm / 6371; // Earth's radius in km

      return await this.propertyModel
        .find({
          isActive: true,
          'location.coordinates': {
            $geoWithin: {
              $centerSphere: [[longitude, latitude], radiusInRadians],
            },
          },
        })
        .populate('host', 'firstName lastName email avatar')
        .populate('amenities')
        .limit(limit)
        .exec();
    } catch (error) {
      LoggingUtil.errorWithException('Location search failed', error, 'PropertySearchService');
      throw new Error('INTERNAL_SERVER_ERROR');
    }
  }

  /**
   * Get featured properties
   */
  async getFeatured(
    limit: number = PAGINATION_CONSTANTS.FEATURED_DEFAULT_LIMIT,
  ): Promise<PropertyDocument[]> {
    try {
      return await this.propertyModel
        .find({
          isActive: true,
          isFeatured: true,
        })
        .populate('host', 'firstName lastName email avatar')
        .populate('amenities')
        .sort({ rating: -1, reviewCount: -1 })
        .limit(limit)
        .exec();
    } catch (error) {
      LoggingUtil.errorWithException(
        'Failed to get featured properties',
        error,
        'PropertySearchService',
      );
      throw new Error('INTERNAL_SERVER_ERROR');
    }
  }

  /**
   * Get popular properties based on bookings and reviews
   */
  async getPopular(
    limit: number = PAGINATION_CONSTANTS.POPULAR_DEFAULT_LIMIT,
  ): Promise<PropertyDocument[]> {
    try {
      return await this.propertyModel
        .find({
          isActive: true,
          reviewCount: { $gte: 5 },
          rating: { $gte: 4 },
        })
        .populate('host', 'firstName lastName email avatar')
        .populate('amenities')
        .sort({ bookingCount: -1, rating: -1 })
        .limit(limit)
        .exec();
    } catch (error) {
      LoggingUtil.errorWithException(
        'Failed to get popular properties',
        error,
        'PropertySearchService',
      );
      throw new Error('INTERNAL_SERVER_ERROR');
    }
  }

  /**
   * Get recently added properties
   */
  async getRecentlyAdded(
    limit: number = PAGINATION_CONSTANTS.RECENT_DEFAULT_LIMIT,
  ): Promise<PropertyDocument[]> {
    try {
      return await this.propertyModel
        .find({ isActive: true })
        .populate('host', 'firstName lastName email avatar')
        .populate('amenities')
        .sort({ createdAt: -1 })
        .limit(limit)
        .exec();
    } catch (error) {
      LoggingUtil.errorWithException(
        'Failed to get recent properties',
        error,
        'PropertySearchService',
      );
      throw new Error('INTERNAL_SERVER_ERROR');
    }
  }

  /**
   * Get similar properties
   */
  async getSimilar(
    propertyId: string,
    limit: number = PAGINATION_CONSTANTS.SIMILAR_DEFAULT_LIMIT,
  ): Promise<PropertyDocument[]> {
    try {
      const property = await this.propertyModel.findById(propertyId);
      if (!property) {
        return [];
      }

      return await this.propertyModel
        .find({
          _id: { $ne: propertyId },
          isActive: true,
          propertyType: property.propertyType,
          $or: [
            { 'address.city': property.address?.city },
            { 'address.country': property.address?.country },
          ],
          pricePerNight: {
            $gte: property.pricePerNight * 0.7,
            $lte: property.pricePerNight * 1.3,
          },
        })
        .populate('host', 'firstName lastName email avatar')
        .populate('amenities')
        .limit(limit)
        .exec();
    } catch (error) {
      LoggingUtil.errorWithException(
        'Failed to get similar properties',
        error,
        'PropertySearchService',
      );
      throw new Error('INTERNAL_SERVER_ERROR');
    }
  }

  /**
   * Build search query from DTO
   */
  private buildSearchQuery(searchDto: PropertySearchDto): MongoQuery {
    const query: MongoQuery = { isActive: true };

    // Text search
    if (searchDto.search) {
      query.$text = { $search: searchDto.search };
    }

    // Location filters
    if (searchDto.location) {
      query.$or = [
        { 'address.city': new RegExp(searchDto.location, 'i') },
        { 'address.country': new RegExp(searchDto.location, 'i') },
        { 'address.state': new RegExp(searchDto.location, 'i') },
        { name: new RegExp(searchDto.location, 'i') },
      ];
    }

    // Property type
    if (searchDto.propertyTypes && searchDto.propertyTypes.length > 0) {
      query.propertyType = { $in: searchDto.propertyTypes };
    }

    // Categories (new)
    if (searchDto.categories && searchDto.categories.length > 0) {
      query.categories = { $in: searchDto.categories };
    }

    // Phase 1: New property attributes
    if (searchDto.viewType) {
      query.viewType = searchDto.viewType;
    }
    if (searchDto.parkingType) {
      query.parkingType = searchDto.parkingType;
    }
    if (searchDto.checkInMethod) {
      query.checkInMethod = searchDto.checkInMethod;
    }

    // Price range
    if (searchDto.minPrice || searchDto.maxPrice) {
      const priceQuery: { $gte?: number; $lte?: number } = {};
      if (searchDto.minPrice) {
        priceQuery.$gte = searchDto.minPrice;
      }
      if (searchDto.maxPrice) {
        priceQuery.$lte = searchDto.maxPrice;
      }
      query.pricePerNight = priceQuery;
    }

    // Capacity
    if (searchDto.guests) {
      query.maxGuests = { $gte: searchDto.guests };
    }
    if (searchDto.bedrooms) {
      query.bedrooms = { $gte: searchDto.bedrooms };
    }
    if (searchDto.bathrooms) {
      query.bathrooms = { $gte: searchDto.bathrooms };
    }

    // Amenities
    if (searchDto.amenities && searchDto.amenities.length > 0) {
      query.amenities = { $in: searchDto.amenities };
    }

    // Host type
    if (searchDto.isSuperhost) {
      query.isSuperhost = true;
    }

    // Instant booking
    if (searchDto.instantBookable) {
      query.instantBooking = true;
    }

    // Availability dates - handle both explicit dates and flexible date ranges
    let checkIn = searchDto.checkIn;
    let checkOut = searchDto.checkOut;

    // If flexible date range is provided, convert it to actual dates
    if (searchDto.flexibleDateRange && !checkIn && !checkOut) {
      const flexibleDates = FlexibleDatesUtil.convertFlexibleDateRange(
        searchDto.flexibleDateRange,
      );
      checkIn = flexibleDates.checkIn.toISOString();
      checkOut = flexibleDates.checkOut.toISOString();
    }

    if (checkIn && checkOut) {
      query.availableDates = {
        $elemMatch: {
          $gte: DateUtils.create(checkIn),
          $lte: DateUtils.create(checkOut),
        },
      };
    }

    return query;
  }

  /**
   * Build sort query
   */
  private buildSortQuery(sortBy?: string, sortOrder?: 'asc' | 'desc'): Record<string, 1 | -1> {
    const order = sortOrder === 'asc' ? 1 : -1;

    switch (sortBy) {
      case 'price_low':
        return { pricePerNight: 1 };
      case 'price_high':
        return { pricePerNight: -1 };
      case 'rating_desc':
        return { rating: -1, reviewCount: -1 };
      case 'rating_asc':
        return { rating: 1, reviewCount: 1 };
      case 'reviews':
        return { reviewCount: order };
      case 'date_desc':
      case 'newest':
        return { createdAt: -1 };
      case 'date_asc':
      case 'oldest':
        return { createdAt: 1 };
      case 'popular':
        return { bookingCount: -1, rating: -1 };
      default:
        return { createdAt: -1 };
    }
  }
}
