import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  AmenityCategory,
  AmenityCategoryDocument,
} from '../../database/schemas/amenity-category.schema';
import {
  CatalogVersion,
  CatalogVersionDocument,
} from '../../database/schemas/catalog-version.schema';
import { BaseCatalogService } from '../../common/services/base-catalog.service';
import { CreateAmenityCategoryDto } from './dto/create-amenity-category.dto';
import { UpdateAmenityCategoryDto } from './dto/update-amenity-category.dto';

@Injectable()
export class AmenityCategoriesService extends BaseCatalogService<AmenityCategoryDocument> {
  constructor(
    @InjectModel(AmenityCategory.name)
    amenityCategoryModel: Model<AmenityCategoryDocument>,
    @InjectModel(CatalogVersion.name)
    catalogVersionModel: Model<CatalogVersionDocument>,
  ) {
    super(amenityCategoryModel, catalogVersionModel, 'AmenityCategory');
  }

  // Frontend-optimized version of findById
  async findByIdForFrontend(id: string): Promise<Partial<AmenityCategoryDocument> | null> {
    return this.model
      .findOne({ _id: id, deletedAt: null })
      .select(this.FRONTEND_FIELDS)
      .lean()
      .exec();
  }

  async createAmenityCategory(
    createDto: CreateAmenityCategoryDto,
    userId?: string,
  ): Promise<AmenityCategoryDocument> {
    return this.create(createDto, userId);
  }

  async updateAmenityCategory(
    id: string,
    updateDto: UpdateAmenityCategoryDto,
    userId?: string,
  ): Promise<AmenityCategoryDocument> {
    return this.update(id, updateDto, userId);
  }

  // Helper method to get total count with filters (for pagination)
  async getTotalCount(filters: {
    search?: string;
    group?: string;
    isActive?: boolean;
  }): Promise<number> {
    const query: Record<string, any> = { deletedAt: null };

    if (filters.isActive !== undefined) query.isActive = filters.isActive;
    if (filters.group) query.group = filters.group;
    if (filters.search) {
      query.$or = [
        { 'name.en': { $regex: filters.search, $options: 'i' } },
        { 'name.fr': { $regex: filters.search, $options: 'i' } },
        { 'name.ar': { $regex: filters.search, $options: 'i' } },
        { key: { $regex: filters.search, $options: 'i' } },
      ];
    }

    return this.model.countDocuments(query);
  }
}
