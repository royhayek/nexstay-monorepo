import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { DateUtils } from '../../common/utils/date.utils';
import { Model, Document, FilterQuery } from 'mongoose';
import { QueryBuilder } from '../utils/query-builder.util';
import { validatePagination } from '../utils/database.utils';
import { BaseCatalog } from '../../database/schemas/base-catalog.schema';
import { CatalogVersionDocument } from '../../database/schemas/catalog-version.schema';
import { LoggingUtil } from '../utils/logging.util';

export interface CreateCatalogDto {
  key: string;
  slug: string;
  name: Record<string, string>;
  description?: Record<string, string>;
  group?: string;
  icon?: string;
  sortOrder?: number;
  isActive?: boolean;
}

export interface UpdateCatalogDto {
  slug?: string;
  name?: Record<string, string>;
  description?: Record<string, string>;
  group?: string;
  icon?: string;
  sortOrder?: number;
  isActive?: boolean;
}

export interface QueryOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  group?: string;
  isActive?: boolean;
  isDeprecated?: boolean;
  select?: string;
}

@Injectable()
export abstract class BaseCatalogService<T extends BaseCatalog & Document> {
  // Optimized field selection for frontend responses (inclusion-only)
  protected readonly FRONTEND_FIELDS =
    '_id key slug name description group icon sortOrder isActive';

  constructor(
    protected readonly model: Model<T>,
    protected readonly catalogVersionModel: Model<CatalogVersionDocument>,
    protected readonly entityName: string,
  ) {}

  async findAll(options: QueryOptions = {}): Promise<T[] | Partial<T>[]> {
    const {
      page = 1,
      limit = 50,
      sortBy = 'sortOrder',
      sortOrder = 'asc',
      search,
      group,
      isActive,
      isDeprecated = false,
      select,
    } = options;

    const { limit: validLimit, skip } = validatePagination({
      page,
      limit,
      maxLimit: 100,
    });

    // Build query using QueryBuilder
    const queryBuilder = QueryBuilder.create()
      .addCustomFilter('deletedAt', null)
      .addBooleanFilter('isDeprecated', isDeprecated)
      .addStringFilter('group', group);

    if (isActive !== undefined) {
      queryBuilder.addBooleanFilter('isActive', isActive);
    }

    if (search) {
      queryBuilder.addCustomFilter('$or', [
        { key: { $regex: search, $options: 'i' } },
        { slug: { $regex: search, $options: 'i' } },
        { 'name.en': { $regex: search, $options: 'i' } },
      ]);
    }

    const query = queryBuilder.build() as FilterQuery<T>;
    const sortDirection = sortOrder === 'desc' ? -1 : 1;

    const mongoQueryBuilder = this.model
      .find(query)
      .sort({ [sortBy]: sortDirection })
      .skip(skip)
      .limit(validLimit);

    if (select) {
      mongoQueryBuilder.select(select);
    }

    return mongoQueryBuilder.exec() as Promise<T[] | Partial<T>[]>;
  }

  // Convenience method for frontend-optimized queries
  async findAllForFrontend(options: Omit<QueryOptions, 'select'> = {}): Promise<Partial<T>[]> {
    return this.findAll({ ...options, select: this.FRONTEND_FIELDS });
  }

  async findByKey(key: string): Promise<T | null> {
    return this.model.findOne({ key, deletedAt: null }).exec();
  }

  async findBySlug(slug: string): Promise<T | null> {
    return this.model.findOne({ slug, deletedAt: null }).exec();
  }

  async findById(id: string): Promise<T | null> {
    return this.model.findOne({ _id: id, deletedAt: null }).exec();
  }

  async create(createDto: CreateCatalogDto, userId?: string): Promise<T> {
    const { key, slug } = createDto;

    // Validate key format (UPPER_SNAKE_CASE)
    if (!/^[A-Z0-9_]+$/.test(key)) {
      throw new BadRequestException(
        `Invalid key format. Use UPPER_SNAKE_CASE (e.g., BASIC_AMENITIES)`,
      );
    }

    // Check for existing key
    const existingByKey = await this.findByKey(key);
    if (existingByKey) {
      throw new BadRequestException(`${this.entityName} with key "${key}" already exists`);
    }

    // Check for existing slug
    const existingBySlug = await this.findBySlug(slug);
    if (existingBySlug) {
      throw new BadRequestException(`${this.entityName} with slug "${slug}" already exists`);
    }

    const entity = new this.model({
      ...createDto,
      createdBy: userId,
      updatedBy: userId,
    });

    const saved = await entity.save();
    await this.incrementCatalogVersion(userId);
    return saved;
  }

  async update(id: string, updateDto: UpdateCatalogDto, userId?: string): Promise<T> {
    const entity = await this.findById(id);
    if (!entity) {
      throw new NotFoundException(`${this.entityName} not found`);
    }

    // Check for slug conflicts if updating slug
    if (updateDto.slug && updateDto.slug !== entity.slug) {
      const existingBySlug = await this.findBySlug(updateDto.slug);
      if (existingBySlug) {
        throw new BadRequestException(
          `${this.entityName} with slug "${updateDto.slug}" already exists`,
        );
      }
    }

    Object.assign(entity, {
      ...updateDto,
      updatedBy: userId,
    });

    const saved = await entity.save();
    await this.incrementCatalogVersion(userId);
    return saved;
  }

  async deprecate(id: string, userId?: string): Promise<T> {
    const entity = await this.findById(id);
    if (!entity) {
      throw new NotFoundException(`${this.entityName} not found`);
    }

    entity.isDeprecated = true;
    entity.updatedBy = userId;

    const saved = await entity.save();
    await this.incrementCatalogVersion(userId);
    return saved;
  }

  async softDelete(id: string, userId?: string): Promise<void> {
    const entity = await this.findById(id);
    if (!entity) {
      throw new NotFoundException(`${this.entityName} not found`);
    }

    entity.deletedAt = DateUtils.now();
    entity.updatedBy = userId;

    await entity.save();
    await this.incrementCatalogVersion(userId);
  }

  async restore(id: string, userId?: string): Promise<T> {
    const entity = await this.model.findById(id).exec();
    if (!entity) {
      throw new NotFoundException(`${this.entityName} not found`);
    }

    entity.deletedAt = undefined;
    entity.isDeprecated = false;
    entity.updatedBy = userId;

    const saved = await entity.save();
    await this.incrementCatalogVersion(userId);
    return saved;
  }

  async count(options: QueryOptions = {}): Promise<number> {
    const { search, group, isActive, isDeprecated = false } = options;

    // Build query using QueryBuilder
    const queryBuilder = QueryBuilder.create()
      .addCustomFilter('deletedAt', null)
      .addBooleanFilter('isDeprecated', isDeprecated)
      .addStringFilter('group', group);

    if (isActive !== undefined) {
      queryBuilder.addBooleanFilter('isActive', isActive);
    }

    if (search) {
      queryBuilder.addCustomFilter('$or', [
        { key: { $regex: search, $options: 'i' } },
        { slug: { $regex: search, $options: 'i' } },
        { 'name.en': { $regex: search, $options: 'i' } },
      ]);
    }

    const query = queryBuilder.build() as FilterQuery<T>;
    return this.model.countDocuments(query).exec();
  }

  protected async incrementCatalogVersion(userId?: string): Promise<void> {
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
      LoggingUtil.error(
        'Failed to increment catalog version',
        error instanceof Error ? error.stack : undefined,
        `${this.entityName}Service`,
      );
    }
  }
}
