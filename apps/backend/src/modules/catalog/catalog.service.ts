import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CatalogItem, CatalogItemDocument } from '../../database/schemas/catalog-item.schema';
import {
  CatalogVersion,
  CatalogVersionDocument,
} from '../../database/schemas/catalog-version.schema';
import { CreateCatalogItemDto } from './dto/create-catalog-item.dto';
import { UpdateCatalogItemDto } from './dto/update-catalog-item.dto';
import { LoggingUtil } from '../../common/utils/logging.util';

@Injectable()
export class CatalogService {
  // Optimized field selection for frontend responses
  private readonly FRONTEND_FIELDS =
    '_id catalogType key slug label description icon group sortOrder isVisible';

  constructor(
    @InjectModel(CatalogItem.name)
    private readonly catalogItemModel: Model<CatalogItemDocument>,
    @InjectModel(CatalogVersion.name)
    private readonly catalogVersionModel: Model<CatalogVersionDocument>,
  ) {}

  /**
   * Find all items for a specific catalog type
   */
  async findByCatalogType(catalogType: string): Promise<CatalogItemDocument[]> {
    return this.catalogItemModel
      .find({ catalogType, deletedAt: null })
      .sort({ sortOrder: 1, key: 1 })
      .exec();
  }

  /**
   * Find all items for a specific catalog type (frontend-optimized)
   */
  async findByCatalogTypeForFrontend(catalogType: string): Promise<Partial<CatalogItemDocument>[]> {
    return this.catalogItemModel
      .find({ catalogType, deletedAt: null, isActive: true, isVisible: true })
      .select(this.FRONTEND_FIELDS)
      .sort({ sortOrder: 1, key: 1 })
      .lean()
      .exec() as unknown as Promise<Partial<CatalogItemDocument>[]>;
  }

  /**
   * Find all items for multiple catalog types (optimized batch query)
   */
  async findByMultipleCatalogTypes(
    types: string[],
  ): Promise<Record<string, CatalogItemDocument[]>> {
    const items = await this.catalogItemModel
      .find({ catalogType: { $in: types }, deletedAt: null })
      .sort({ catalogType: 1, sortOrder: 1, key: 1 })
      .exec();

    // Group by catalog type
    const grouped: Record<string, CatalogItemDocument[]> = {};
    for (const item of items) {
      if (!grouped[item.catalogType]) {
        grouped[item.catalogType] = [];
      }
      grouped[item.catalogType].push(item);
    }

    return grouped;
  }

  /**
   * Find all catalogs for frontend (all types or specific types)
   */
  async findAllForFrontend(
    types?: string[],
  ): Promise<Record<string, Partial<CatalogItemDocument>[]>> {
    const query: any = { deletedAt: null, isActive: true, isVisible: true };

    if (types && types.length > 0) {
      query.catalogType = { $in: types };
    }

    const items = (await this.catalogItemModel
      .find(query)
      .select(this.FRONTEND_FIELDS)
      .sort({ catalogType: 1, sortOrder: 1, key: 1 })
      .lean()
      .exec()) as unknown as Partial<CatalogItemDocument>[];

    // Group by catalog type
    const grouped: Record<string, Partial<CatalogItemDocument>[]> = {};
    for (const item of items) {
      const type = item.catalogType as string;
      if (!grouped[type]) {
        grouped[type] = [];
      }
      grouped[type].push(item);
    }

    return grouped;
  }

  /**
   * Find item by ID
   */
  async findById(id: string): Promise<CatalogItemDocument | null> {
    return this.catalogItemModel.findOne({ _id: id, deletedAt: null }).exec();
  }

  /**
   * Find item by catalog type and key
   */
  async findByTypeAndKey(catalogType: string, key: string): Promise<CatalogItemDocument | null> {
    return this.catalogItemModel.findOne({ catalogType, key, deletedAt: null }).exec();
  }

  /**
   * Create a new catalog item
   */
  async create(createDto: CreateCatalogItemDto, userId?: string): Promise<CatalogItemDocument> {
    const { catalogType, key } = createDto;

    // Check if item with same catalogType + key already exists
    const existing = await this.findByTypeAndKey(catalogType, key);
    if (existing) {
      throw new BadRequestException(
        `Catalog item with type "${catalogType}" and key "${key}" already exists`,
      );
    }

    const catalogItem = new this.catalogItemModel({
      ...createDto,
      createdBy: userId,
      updatedBy: userId,
    });

    const saved = await catalogItem.save();
    await this.incrementCatalogVersion(userId);
    return saved;
  }

  /**
   * Update a catalog item
   */
  async update(
    id: string,
    updateDto: UpdateCatalogItemDto,
    userId?: string,
  ): Promise<CatalogItemDocument> {
    const catalogItem = await this.findById(id);
    if (!catalogItem) {
      throw new NotFoundException(`Catalog item with ID "${id}" not found`);
    }

    Object.assign(catalogItem, {
      ...updateDto,
      updatedBy: userId,
    });

    const saved = await catalogItem.save();
    await this.incrementCatalogVersion(userId);
    return saved;
  }

  /**
   * Soft delete a catalog item
   */
  async softDelete(id: string, userId?: string): Promise<void> {
    const catalogItem = await this.findById(id);
    if (!catalogItem) {
      throw new NotFoundException(`Catalog item with ID "${id}" not found`);
    }

    catalogItem.deletedAt = new Date();
    catalogItem.updatedBy = userId;
    await catalogItem.save();

    await this.incrementCatalogVersion(userId);
  }

  /**
   * Restore a soft-deleted catalog item
   */
  async restore(id: string, userId?: string): Promise<CatalogItemDocument> {
    const catalogItem = await this.catalogItemModel.findById(id).exec();
    if (!catalogItem) {
      throw new NotFoundException(`Catalog item with ID "${id}" not found`);
    }

    catalogItem.deletedAt = undefined;
    catalogItem.updatedBy = userId;
    const restored = await catalogItem.save();

    await this.incrementCatalogVersion(userId);
    return restored;
  }

  /**
   * Find with pagination, search, and filters (for admin)
   */
  async findWithPagination(params: {
    catalogType?: string;
    page?: number;
    limit?: number;
    search?: string;
    group?: string;
    isActive?: boolean;
    includeDeleted?: boolean;
  }) {
    const {
      catalogType,
      page = 1,
      limit = 50,
      search,
      group,
      isActive,
      includeDeleted = false,
    } = params;

    const query: any = {};

    if (catalogType) {
      // Support both single type and comma-separated multiple types
      const types = catalogType
        .split(',')
        .map((t) => t.trim())
        .filter((t) => t);
      if (types.length === 1) {
        query.catalogType = types[0];
      } else if (types.length > 1) {
        query.catalogType = { $in: types };
      }
    }

    if (!includeDeleted) {
      query.deletedAt = null;
    }

    if (isActive !== undefined) {
      query.isActive = isActive;
    }

    if (group) {
      query.group = group;
    }

    if (search) {
      query.$or = [
        { key: { $regex: search, $options: 'i' } },
        { slug: { $regex: search, $options: 'i' } },
        { 'label.en': { $regex: search, $options: 'i' } },
        { 'label.fr': { $regex: search, $options: 'i' } },
        { 'label.ar': { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.catalogItemModel
        .find(query)
        .sort({ sortOrder: 1, key: 1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.catalogItemModel.countDocuments(query),
    ]);

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get catalog version for cache invalidation
   */
  async getCatalogVersion() {
    const version = await this.catalogVersionModel
      .findOne({ id: 'default' })
      .select('version updatedAt')
      .exec();

    return {
      version: version?.version || 1,
      lastModified: version?.updatedAt || new Date(),
    };
  }

  /**
   * Increment catalog version (for cache invalidation)
   */
  private async incrementCatalogVersion(userId?: string): Promise<void> {
    try {
      await this.catalogVersionModel
        .findOneAndUpdate(
          { id: 'default' },
          {
            $inc: { version: 1 },
            lastModifiedBy: userId,
          },
          { upsert: true, new: true },
        )
        .exec();
    } catch (error) {
      LoggingUtil.errorWithException(
        'Failed to increment catalog version',
        error,
        'CatalogService',
      );
    }
  }
}
