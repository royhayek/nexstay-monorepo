import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PropertyCoreService } from './property-core.service';
import { PropertySearchService } from './property-search.service';
import { PropertyManagementService } from './property-management.service';
import { PropertyAdminService } from './property-admin.service';
import { InternalCreatePropertyDto } from '../dto/internal-property.dto';
import { UpdatePropertyDto } from '../dto/update-property.dto';
import { PropertySearchDto } from '../dto/property-search.dto';
import { PropertyDocument, ImageSchema } from '../../../database/schemas/property.schema';
import { User, UserDocument } from '../../../database/schemas/user.schema';
import { PropertyStatus, ModerationStatus } from '../../../common/enums/property.enums';
import { PAGINATION_CONSTANTS } from '../constants/pagination.constants';
import { BooleanStringUtils } from '../constants/property.constants';

/**
 * Properties Facade Service
 * Coordinates all property-related operations and provides a unified interface
 * This service follows the Facade pattern to simplify property module interactions
 */
@Injectable()
export class PropertiesFacadeService {
  constructor(
    private readonly coreService: PropertyCoreService,
    private readonly searchService: PropertySearchService,
    private readonly managementService: PropertyManagementService,
    private readonly adminService: PropertyAdminService,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
  ) {}

  // ========== Core Operations ==========

  async create(createPropertyDto: InternalCreatePropertyDto) {
    return this.coreService.create(createPropertyDto);
  }

  async findById(id: string) {
    return this.coreService.findById(id);
  }

  async findAll(page?: number, limit?: number) {
    return this.coreService.findAll(page, limit);
  }

  async findByUserId(userId: string) {
    return this.coreService.findByUserId(userId);
  }

  async update(id: string, updatePropertyDto: UpdatePropertyDto) {
    return this.coreService.update(id, updatePropertyDto);
  }

  async delete(id: string) {
    return this.coreService.delete(id);
  }

  async hardDelete(id: string) {
    return this.coreService.hardDelete(id);
  }

  async verifyOwnership(propertyId: string, userId: string) {
    return this.coreService.verifyOwnership(propertyId, userId);
  }

  async updateStatus(id: string, status: PropertyStatus) {
    return this.coreService.updateStatus(id, status);
  }

  async publish(id: string) {
    return this.coreService.publish(id);
  }

  async unpublish(id: string) {
    return this.coreService.unpublish(id);
  }

  async suspend(id: string) {
    return this.coreService.suspend(id);
  }

  // ========== Search Operations ==========

  async search(searchDto: PropertySearchDto) {
    return this.searchService.search(searchDto);
  }

  async searchWithFilterOptions(searchDto: PropertySearchDto) {
    return this.searchService.searchWithFilterOptions(searchDto);
  }

  async getSearchFilterOptions() {
    return this.searchService.getSearchFilterOptions();
  }

  async searchByLocation(latitude: number, longitude: number, radiusInKm?: number, limit?: number) {
    return this.searchService.searchByLocation(latitude, longitude, radiusInKm, limit);
  }

  async getFeatured(limit?: number) {
    return this.searchService.getFeatured(limit);
  }

  async getPopular(limit?: number) {
    return this.searchService.getPopular(limit);
  }

  async getRecentlyAdded(limit?: number) {
    return this.searchService.getRecentlyAdded(limit);
  }

  async getSimilar(propertyId: string, limit?: number) {
    return this.searchService.getSimilar(propertyId, limit);
  }

  // ========== Management Operations ==========

  async addImage(propertyId: string, imageData: ImageSchema) {
    return this.managementService.addImage(propertyId, imageData);
  }

  async removeImage(propertyId: string, imageKey: string) {
    return this.managementService.removeImage(propertyId, imageKey);
  }

  async updateAvailability(propertyId: string, dates: Date[], available: boolean) {
    return this.managementService.updateAvailability(propertyId, dates, available);
  }

  async updatePricing(
    propertyId: string,
    pricePerNight: number,
    cleaningFee?: number,
    serviceFee?: number,
  ) {
    return this.managementService.updatePricing(propertyId, pricePerNight, cleaningFee, serviceFee);
  }

  async getStatistics(propertyId: string) {
    return this.managementService.getStatistics(propertyId);
  }

  async incrementViewCount(propertyId: string) {
    return this.managementService.incrementViewCount(propertyId);
  }

  async updateRating(propertyId: string) {
    return this.managementService.updateRating(propertyId);
  }

  async checkAvailability(propertyId: string, checkIn: Date, checkOut: Date) {
    return this.managementService.checkAvailability(propertyId, checkIn, checkOut);
  }

  async getBookedDates(propertyId: string) {
    return this.managementService.getBookedDates(propertyId);
  }

  // ========== Calendar Management Operations ==========

  async blockDates(propertyId: string, blockDatesDto: any, userId: string) {
    return this.managementService.blockDates(propertyId, blockDatesDto, userId);
  }

  async unblockDates(propertyId: string, blockedDateIds: string[], userId: string) {
    return this.managementService.unblockDates(propertyId, blockedDateIds, userId);
  }

  async getCalendarView(propertyId: string, startDate?: Date, endDate?: Date) {
    return this.managementService.getCalendarView(propertyId, startDate, endDate);
  }

  // ========== Admin Operations ==========

  async getAllForAdmin(
    page?: number,
    limit?: number,
    filters?: {
      status?: PropertyStatus;
      featured?: boolean;
      verified?: boolean;
      hostId?: string;
    },
  ) {
    return this.adminService.getAllForAdmin(page, limit, filters);
  }

  async toggleFeatured(propertyId: string) {
    return this.adminService.toggleFeatured(propertyId);
  }

  async toggleVerified(propertyId: string) {
    return this.adminService.toggleVerified(propertyId);
  }

  async bulkUpdateStatus(propertyIds: string[], isActive: boolean) {
    return this.adminService.bulkUpdateStatus(propertyIds, isActive);
  }

  async bulkDelete(propertyIds: string[]) {
    return this.adminService.bulkDelete(propertyIds);
  }

  async getAdminStatistics() {
    return this.adminService.getAdminStatistics();
  }

  async getFlaggedProperties(limit?: number) {
    return this.adminService.getFlaggedProperties(limit);
  }

  async updateModerationStatus(propertyId: string, status: ModerationStatus, reason?: string) {
    return this.adminService.updateModerationStatus(propertyId, status, reason);
  }

  async findAllAdmin(filters: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    hostId?: string;
    type?: string;
    roomType?: string;
    minPrice?: number;
    maxPrice?: number;
    minRating?: number;
    isPublished?: string;
    instantBookable?: string;
    businessTravelReady?: string;
    isSuperhost?: string;
    featured?: string;
    verified?: string;
  }) {
    const page = Number(filters.page) || PAGINATION_CONSTANTS.DEFAULT_PAGE;
    const limit = Number(filters.limit) || PAGINATION_CONSTANTS.ADMIN_DEFAULT_LIMIT;

    // Build PropertySearchDto with all filters
    // Convert comma-separated strings to arrays for propertyTypes and roomTypes
    const searchDto: PropertySearchDto = {
      page,
      limit,
      search: filters.search,
      propertyTypes: filters.type ? filters.type.split(',').map((t) => t.trim()) : undefined,
      roomTypes: filters.roomType ? filters.roomType.split(',').map((t) => t.trim()) : undefined,
      minPrice: filters.minPrice,
      maxPrice: filters.maxPrice,
      instantBookable: BooleanStringUtils.parseBoolean(filters.instantBookable),
      isSuperhost: BooleanStringUtils.parseBoolean(filters.isSuperhost),
    };

    // Use search service which already handles all these filters properly
    const result = await this.searchService.search(searchDto);

    return {
      items: result.items,
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
      hasNextPage: result.hasNextPage,
      hasPrevPage: result.hasPrevPage,
    };
  }

  async findPropertiesForDropdown(search: string) {
    const result = await this.searchService.search({
      search,
      limit: PAGINATION_CONSTANTS.DROPDOWN_SEARCH_LIMIT,
    });
    return result.items || [];
  }

  async updateByAdmin(id: string, updateDto: UpdatePropertyDto, _adminId: string) {
    // For admin updates, we can use the regular update method
    // Admin permissions are handled at the controller level
    return this.update(id, updateDto);
  }

  removeImageFromProperty(_key: string) {
    // For now, return true as image removal is handled by S3Service
    // Database updates are handled separately by property management
    return true;
  }

  async deleteByAdmin(id: string, _adminId: string) {
    // For admin deletes, we can use the regular delete method
    // Admin permissions are handled at the controller level
    return this.delete(id);
  }

  async toggleStatusByAdmin(id: string, _adminId: string) {
    const property = await this.findById(id);
    // Toggle between published and draft (suspended properties stay suspended)
    const newStatus =
      property.status === PropertyStatus.PUBLISHED
        ? PropertyStatus.DRAFT
        : PropertyStatus.PUBLISHED;
    return this.coreService.updateStatus(id, newStatus);
  }

  async togglePublishedByAdmin(id: string, _adminId: string) {
    // For now, just return the property as-is
    // This functionality needs to be implemented in the admin service
    return this.findById(id);
  }

  async approveProperty(id: string, _adminId: string) {
    // Use admin service for moderation operations
    return this.adminService.updateModerationStatus(id, ModerationStatus.APPROVED);
  }

  async rejectProperty(id: string, _adminId: string) {
    // Use admin service for moderation operations
    return this.adminService.updateModerationStatus(id, ModerationStatus.REJECTED);
  }

  // ========== Legacy Support (for backward compatibility) ==========

  /**
   * Get current user's properties (legacy support)
   * @deprecated Use findByUserId directly
   */
  async getMyProperties(userId: string): Promise<PropertyDocument[]> {
    return this.findByUserId(userId);
  }

  /**
   * Create property for current user (legacy support)
   * @deprecated Use create directly with userId in DTO
   */
  async createForUser(
    userId: string,
    createPropertyDto: Partial<InternalCreatePropertyDto>,
  ): Promise<PropertyDocument> {
    const internalDto = {
      ...createPropertyDto,
      hostId: userId,
    };
    return this.create(internalDto as InternalCreatePropertyDto);
  }

  /**
   * Update property with ownership check (legacy support)
   * @deprecated Use verifyOwnership then update
   */
  async updateWithOwnershipCheck(
    propertyId: string,
    userId: string,
    updateDto: UpdatePropertyDto,
  ): Promise<PropertyDocument> {
    const isOwner = await this.verifyOwnership(propertyId, userId);
    if (!isOwner) {
      throw new Error('FORBIDDEN');
    }
    return this.update(propertyId, updateDto);
  }

  /**
   * Delete property with ownership check (legacy support)
   * @deprecated Use verifyOwnership then delete
   */
  async deleteWithOwnershipCheck(propertyId: string, userId: string): Promise<PropertyDocument> {
    const isOwner = await this.verifyOwnership(propertyId, userId);
    if (!isOwner) {
      throw new Error('FORBIDDEN');
    }
    return this.delete(propertyId);
  }

  /**
   * Toggle property status with ownership check (legacy support)
   * @deprecated Use verifyOwnership then updateStatus
   */
  async toggleStatusByOwner(propertyId: string, userId: string): Promise<PropertyDocument> {
    const isOwner = await this.verifyOwnership(propertyId, userId);
    if (!isOwner) {
      throw new Error('FORBIDDEN');
    }
    const property = await this.findById(propertyId);
    // Toggle between published and draft
    const newStatus =
      property.status === PropertyStatus.PUBLISHED
        ? PropertyStatus.DRAFT
        : PropertyStatus.PUBLISHED;
    return this.updateStatus(propertyId, newStatus);
  }

  // ========== Wishlist Helper Operations ==========

  /**
   * Populate isFavorited flag for properties based on user's wishlist
   * @param properties - Array of properties (can be plain objects or documents)
   * @param userId - User ID to check wishlist against
   * @returns Array of properties with isFavorited flag added
   */
  async populateIsFavorited<T extends { _id: any }>(
    properties: T[],
    userId: string,
  ): Promise<(T & { isFavorited: boolean })[]> {
    if (!userId || properties.length === 0) {
      return properties.map((property) => ({ ...property, isFavorited: false }));
    }

    try {
      // Get user's wishlist
      const user = await this.userModel.findById(userId).select('wishlist').lean().exec();

      if (!user || !user.wishlist || user.wishlist.length === 0) {
        return properties.map((property) => ({ ...property, isFavorited: false }));
      }

      // Convert wishlist to Set of strings for efficient lookup
      const wishlistSet = new Set(user.wishlist.map((id) => id.toString()));

      // Add isFavorited flag to each property
      return properties.map((property) => ({
        ...property,
        isFavorited: wishlistSet.has(property._id.toString()),
      }));
    } catch (error) {
      // If there's an error, just return properties with isFavorited = false
      return properties.map((property) => ({ ...property, isFavorited: false }));
    }
  }

  /**
   * Search properties with isFavorited flag for authenticated users
   * @param searchDto - Search parameters
   * @param userId - Optional user ID to populate isFavorited flags
   * @returns Paginated search results with isFavorited flags
   */
  async searchWithFavorites(searchDto: PropertySearchDto, userId?: string) {
    const result = await this.searchService.search(searchDto);

    if (!userId || result.items.length === 0) {
      return result;
    }

    const itemsWithFavorites = await this.populateIsFavorited(result.items, userId);

    return {
      ...result,
      items: itemsWithFavorites,
    };
  }
}
