import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SavedSearch, SavedSearchDocument } from '../../../database/schemas/saved-search.schema';
import { SearchHistory, SearchHistoryDocument } from '../../../database/schemas/search-history.schema';
import {
  CreateSavedSearchDto,
  UpdateSavedSearchDto,
  SavedSearchDataDto,
  SearchHistoryDataDto,
} from '../dto/saved-search.dto';
import { PropertySearchDto } from '../dto/property-search.dto';
import { PaginatedDto } from '../../../common/dto/paginated.dto';
import { ValidationUtils } from '../../../common/utils/validation.utils';
import { LoggingUtil } from '../../../common/utils/logging.util';
import { DateUtils } from '../../../common/utils/date.utils';

/**
 * Search Preferences Service
 * Handles saved searches and search history functionality
 */
@Injectable()
export class SearchPreferencesService {
  constructor(
    @InjectModel(SavedSearch.name)
    private readonly savedSearchModel: Model<SavedSearchDocument>,
    @InjectModel(SearchHistory.name)
    private readonly searchHistoryModel: Model<SearchHistoryDocument>,
  ) {}

  /**
   * Create a new saved search
   */
  async createSavedSearch(
    userId: string,
    dto: CreateSavedSearchDto,
  ): Promise<SavedSearchDataDto> {
    ValidationUtils.validateObjectId(userId, 'userId', { context: 'SearchPreferencesService' });

    try {
      // If setting as default, remove default from all other searches
      if (dto.isDefault) {
        await this.savedSearchModel.updateMany(
          { userId, isDefault: true },
          { $set: { isDefault: false } },
        );
      }

      const savedSearch = await this.savedSearchModel.create({
        userId,
        ...dto,
        useCount: 0,
        isActive: true,
      });

      LoggingUtil.log(
        `Saved search created for user ${userId}: ${savedSearch._id}`,
        'SearchPreferencesService',
      );

      return this.mapToSavedSearchDto(savedSearch);
    } catch (error) {
      LoggingUtil.errorWithException(
        `Error creating saved search for user ${userId}`,
        error,
        'SearchPreferencesService',
      );
      throw new BadRequestException('Failed to create saved search');
    }
  }

  /**
   * Get all saved searches for a user
   */
  async getSavedSearches(
    userId: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<PaginatedDto<SavedSearchDataDto>> {
    ValidationUtils.validateObjectId(userId, 'userId', { context: 'SearchPreferencesService' });

    try {
      const skip = (page - 1) * limit;

      const [items, total] = await Promise.all([
        this.savedSearchModel
          .find({ userId, isActive: true })
          .sort({ isDefault: -1, lastUsedAt: -1, createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .exec(),
        this.savedSearchModel.countDocuments({ userId, isActive: true }),
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        items: items.map((item) => this.mapToSavedSearchDto(item)),
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      };
    } catch (error) {
      LoggingUtil.errorWithException(
        `Error getting saved searches for user ${userId}`,
        error,
        'SearchPreferencesService',
      );
      throw new BadRequestException('Failed to get saved searches');
    }
  }

  /**
   * Get a single saved search by ID
   */
  async getSavedSearchById(userId: string, searchId: string): Promise<SavedSearchDataDto> {
    ValidationUtils.validateObjectId(userId, 'userId', { context: 'SearchPreferencesService' });
    ValidationUtils.validateObjectId(searchId, 'searchId', {
      context: 'SearchPreferencesService',
    });

    try {
      const savedSearch = await this.savedSearchModel.findOne({
        _id: searchId,
        userId,
        isActive: true,
      });

      if (!savedSearch) {
        throw new NotFoundException('Saved search not found');
      }

      // Increment use count and update last used date
      savedSearch.useCount += 1;
      savedSearch.lastUsedAt = DateUtils.now();
      await savedSearch.save();

      return this.mapToSavedSearchDto(savedSearch);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      LoggingUtil.errorWithException(
        `Error getting saved search ${searchId} for user ${userId}`,
        error,
        'SearchPreferencesService',
      );
      throw new BadRequestException('Failed to get saved search');
    }
  }

  /**
   * Update a saved search
   */
  async updateSavedSearch(
    userId: string,
    searchId: string,
    dto: UpdateSavedSearchDto,
  ): Promise<SavedSearchDataDto> {
    ValidationUtils.validateObjectId(userId, 'userId', { context: 'SearchPreferencesService' });
    ValidationUtils.validateObjectId(searchId, 'searchId', {
      context: 'SearchPreferencesService',
    });

    try {
      // If setting as default, remove default from all other searches
      if (dto.isDefault) {
        await this.savedSearchModel.updateMany(
          { userId, _id: { $ne: searchId }, isDefault: true },
          { $set: { isDefault: false } },
        );
      }

      const savedSearch = await this.savedSearchModel.findOneAndUpdate(
        { _id: searchId, userId, isActive: true },
        { $set: dto },
        { new: true },
      );

      if (!savedSearch) {
        throw new NotFoundException('Saved search not found');
      }

      LoggingUtil.log(
        `Saved search updated: ${searchId} for user ${userId}`,
        'SearchPreferencesService',
      );

      return this.mapToSavedSearchDto(savedSearch);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      LoggingUtil.errorWithException(
        `Error updating saved search ${searchId} for user ${userId}`,
        error,
        'SearchPreferencesService',
      );
      throw new BadRequestException('Failed to update saved search');
    }
  }

  /**
   * Delete a saved search (soft delete)
   */
  async deleteSavedSearch(userId: string, searchId: string): Promise<void> {
    ValidationUtils.validateObjectId(userId, 'userId', { context: 'SearchPreferencesService' });
    ValidationUtils.validateObjectId(searchId, 'searchId', {
      context: 'SearchPreferencesService',
    });

    try {
      const savedSearch = await this.savedSearchModel.findOneAndUpdate(
        { _id: searchId, userId, isActive: true },
        { $set: { isActive: false, deletedAt: DateUtils.now() } },
        { new: true },
      );

      if (!savedSearch) {
        throw new NotFoundException('Saved search not found');
      }

      LoggingUtil.log(
        `Saved search deleted: ${searchId} for user ${userId}`,
        'SearchPreferencesService',
      );
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      LoggingUtil.errorWithException(
        `Error deleting saved search ${searchId} for user ${userId}`,
        error,
        'SearchPreferencesService',
      );
      throw new BadRequestException('Failed to delete saved search');
    }
  }

  /**
   * Record a search in history
   */
  async recordSearchHistory(
    userId: string,
    searchDto: PropertySearchDto,
    resultsCount: number,
  ): Promise<void> {
    ValidationUtils.validateObjectId(userId, 'userId', { context: 'SearchPreferencesService' });

    try {
      await this.searchHistoryModel.create({
        userId,
        ...searchDto,
        resultsCount,
        hasResults: resultsCount > 0,
      });

      LoggingUtil.log(
        `Search history recorded for user ${userId} with ${resultsCount} results`,
        'SearchPreferencesService',
      );
    } catch (error) {
      // Don't throw error, just log it - search history is not critical
      LoggingUtil.errorWithException(
        `Error recording search history for user ${userId}`,
        error,
        'SearchPreferencesService',
      );
    }
  }

  /**
   * Get search history for a user
   */
  async getSearchHistory(
    userId: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<PaginatedDto<SearchHistoryDataDto>> {
    ValidationUtils.validateObjectId(userId, 'userId', { context: 'SearchPreferencesService' });

    try {
      const skip = (page - 1) * limit;

      const [items, total] = await Promise.all([
        this.searchHistoryModel
          .find({ userId })
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .exec(),
        this.searchHistoryModel.countDocuments({ userId }),
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        items: items.map((item) => this.mapToSearchHistoryDto(item)),
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      };
    } catch (error) {
      LoggingUtil.errorWithException(
        `Error getting search history for user ${userId}`,
        error,
        'SearchPreferencesService',
      );
      throw new BadRequestException('Failed to get search history');
    }
  }

  /**
   * Clear search history for a user
   */
  async clearSearchHistory(userId: string): Promise<void> {
    ValidationUtils.validateObjectId(userId, 'userId', { context: 'SearchPreferencesService' });

    try {
      await this.searchHistoryModel.deleteMany({ userId });

      LoggingUtil.log(
        `Search history cleared for user ${userId}`,
        'SearchPreferencesService',
      );
    } catch (error) {
      LoggingUtil.errorWithException(
        `Error clearing search history for user ${userId}`,
        error,
        'SearchPreferencesService',
      );
      throw new BadRequestException('Failed to clear search history');
    }
  }

  /**
   * Map SavedSearchDocument to DTO
   */
  private mapToSavedSearchDto(doc: SavedSearchDocument): SavedSearchDataDto {
    const filters: Record<string, any> = {};

    // Extract all search filters
    if (doc.search) filters.search = doc.search;
    if (doc.location) filters.location = doc.location;
    if (doc.latitude) filters.latitude = doc.latitude;
    if (doc.longitude) filters.longitude = doc.longitude;
    if (doc.radius) filters.radius = doc.radius;
    if (doc.checkIn) filters.checkIn = doc.checkIn;
    if (doc.checkOut) filters.checkOut = doc.checkOut;
    if (doc.flexibleDateRange) filters.flexibleDateRange = doc.flexibleDateRange;
    if (doc.propertyTypes) filters.propertyTypes = doc.propertyTypes;
    if (doc.roomTypes) filters.roomTypes = doc.roomTypes;
    if (doc.categories) filters.categories = doc.categories;
    if (doc.minPrice) filters.minPrice = doc.minPrice;
    if (doc.maxPrice) filters.maxPrice = doc.maxPrice;
    if (doc.currency) filters.currency = doc.currency;
    if (doc.guests) filters.guests = doc.guests;
    if (doc.adults) filters.adults = doc.adults;
    if (doc.children) filters.children = doc.children;
    if (doc.infants) filters.infants = doc.infants;
    if (doc.bedrooms) filters.bedrooms = doc.bedrooms;
    if (doc.beds) filters.beds = doc.beds;
    if (doc.bathrooms) filters.bathrooms = doc.bathrooms;
    if (doc.amenities) filters.amenities = doc.amenities;
    if (doc.instantBookable !== undefined) filters.instantBookable = doc.instantBookable;
    if (doc.isSuperhost !== undefined) filters.isSuperhost = doc.isSuperhost;
    if (doc.cancellationPolicy) filters.cancellationPolicy = doc.cancellationPolicy;
    if (doc.sortBy) filters.sortBy = doc.sortBy;
    if (doc.sortOrder) filters.sortOrder = doc.sortOrder;

    return {
      id: String(doc._id),
      name: doc.name,
      description: doc.description,
      filters,
      useCount: doc.useCount || 0,
      isDefault: doc.isDefault || false,
      lastUsedAt: doc.lastUsedAt,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  }

  /**
   * Map SearchHistoryDocument to DTO
   */
  private mapToSearchHistoryDto(doc: SearchHistoryDocument): SearchHistoryDataDto {
    const filters: Record<string, any> = {};

    // Extract all search filters
    if (doc.search) filters.search = doc.search;
    if (doc.location) filters.location = doc.location;
    if (doc.latitude) filters.latitude = doc.latitude;
    if (doc.longitude) filters.longitude = doc.longitude;
    if (doc.radius) filters.radius = doc.radius;
    if (doc.checkIn) filters.checkIn = doc.checkIn;
    if (doc.checkOut) filters.checkOut = doc.checkOut;
    if (doc.flexibleDateRange) filters.flexibleDateRange = doc.flexibleDateRange;
    if (doc.propertyTypes) filters.propertyTypes = doc.propertyTypes;
    if (doc.roomTypes) filters.roomTypes = doc.roomTypes;
    if (doc.categories) filters.categories = doc.categories;
    if (doc.minPrice) filters.minPrice = doc.minPrice;
    if (doc.maxPrice) filters.maxPrice = doc.maxPrice;
    if (doc.currency) filters.currency = doc.currency;
    if (doc.guests) filters.guests = doc.guests;
    if (doc.adults) filters.adults = doc.adults;
    if (doc.children) filters.children = doc.children;
    if (doc.infants) filters.infants = doc.infants;
    if (doc.bedrooms) filters.bedrooms = doc.bedrooms;
    if (doc.beds) filters.beds = doc.beds;
    if (doc.bathrooms) filters.bathrooms = doc.bathrooms;
    if (doc.amenities) filters.amenities = doc.amenities;
    if (doc.instantBookable !== undefined) filters.instantBookable = doc.instantBookable;
    if (doc.isSuperhost !== undefined) filters.isSuperhost = doc.isSuperhost;
    if (doc.cancellationPolicy) filters.cancellationPolicy = doc.cancellationPolicy;
    if (doc.sortBy) filters.sortBy = doc.sortBy;
    if (doc.sortOrder) filters.sortOrder = doc.sortOrder;

    return {
      id: String(doc._id),
      filters,
      resultsCount: doc.resultsCount || 0,
      hasResults: doc.hasResults || false,
      createdAt: doc.createdAt,
    };
  }
}
