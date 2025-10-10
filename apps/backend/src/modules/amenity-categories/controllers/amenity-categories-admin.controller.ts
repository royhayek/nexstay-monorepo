import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiParam, ApiQuery } from '@nestjs/swagger';
import { BaseController } from '../../../common/controllers/base.controller';
import { AmenityCategoriesService } from '../amenity-categories.service';
import { CreateAmenityCategoryDto } from '../dto/create-amenity-category.dto';
import { UpdateAmenityCategoryDto } from '../dto/update-amenity-category.dto';
import { AdminEndpoint } from '../../../common/decorators/api-endpoint.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import type { UserDocument } from '../../../database/schemas/user.schema';
import {
  AmenityCategoryResponseDto,
  AmenityCategoryListResponseDto,
  AmenityCategoryDeleteResponseDto,
} from '../dto/amenity-category-response.dto';

/**
 * Admin Controller for Amenity Categories
 * Handles administrative amenity category management operations
 */
@Controller('admin/amenity-categories')
@ApiTags('Amenity Categories Management')
export class AmenityCategoriesAdminController extends BaseController {
  constructor(private readonly amenityCategoriesService: AmenityCategoriesService) {
    super();
  }

  @Get()
  @AdminEndpoint(
    'Get all amenity categories (Admin)',
    'Returns paginated amenity categories with filtering and search capabilities',
    AmenityCategoryListResponseDto,
  )
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Search term' })
  @ApiQuery({ name: 'group', required: false, type: String, description: 'Category group' })
  @ApiQuery({
    name: 'isActive',
    required: false,
    type: Boolean,
    description: 'Filter by active status',
  })
  async findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('group') group?: string,
    @Query('isActive') isActive?: boolean,
  ) {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        const currentPage = page || 1;
        const currentLimit = Math.min(limit || 20, 100); // Max 100 items per page

        // Get the data using existing findAll method
        const data = await this.amenityCategoriesService.findAll({
          page: currentPage,
          limit: currentLimit,
          search,
          group,
          isActive,
        });

        // Get total count for pagination metadata
        const total = await this.amenityCategoriesService.getTotalCount({
          search,
          group,
          isActive,
        });

        const totalPages = Math.ceil(total / currentLimit);
        const hasNextPage = currentPage < totalPages;
        const hasPrevPage = currentPage > 1;

        return {
          categories: data,
          total,
          page: currentPage,
          limit: currentLimit,
          pages: totalPages,
          hasNext: hasNextPage,
          hasPrev: hasPrevPage,
        };
      },
      'Get All Amenity Categories',
      'Amenity Categories List',
      'Amenity categories retrieved successfully',
      'Failed to retrieve amenity categories',
    );
  }

  @Get(':id')
  @AdminEndpoint(
    'Get amenity category by ID (Admin)',
    'Returns a specific amenity category by its ID',
    AmenityCategoryResponseDto,
  )
  @ApiParam({ name: 'id', description: 'Category ID' })
  async findById(@Param('id') id: string) {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        return this.amenityCategoriesService.findById(id);
      },
      'Get Amenity Category by ID',
      'Get Amenity Category',
      'Amenity category retrieved successfully',
      'Failed to retrieve amenity category',
    );
  }

  @Get('key/:key')
  @AdminEndpoint(
    'Get amenity category by key (Admin)',
    'Returns a specific amenity category by its unique key',
    AmenityCategoryResponseDto,
  )
  @ApiParam({ name: 'key', description: 'Category key' })
  async findByKey(@Param('key') key: string) {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        return this.amenityCategoriesService.findByKey(key);
      },
      'Get Amenity Category by Key',
      'Get Amenity Category by Key',
      'Amenity category retrieved successfully',
      'Failed to retrieve amenity category',
    );
  }

  @Post()
  @AdminEndpoint(
    'Create amenity category (System Admin only)',
    'Creates a new amenity category with validation',
    AmenityCategoryResponseDto,
  )
  async create(@Body() createDto: CreateAmenityCategoryDto, @CurrentUser() user: UserDocument) {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        return this.amenityCategoriesService.createAmenityCategory(createDto, String(user._id));
      },
      'Create New Amenity Category',
      'Create Amenity Category',
      'Amenity category created successfully',
      'Failed to create amenity category',
    );
  }

  @Put(':id')
  @AdminEndpoint(
    'Update amenity category (System Admin only)',
    'Updates an existing amenity category',
    AmenityCategoryResponseDto,
  )
  @ApiParam({ name: 'id', description: 'Category ID' })
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateAmenityCategoryDto,
    @CurrentUser() user: UserDocument,
  ) {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        return this.amenityCategoriesService.updateAmenityCategory(id, updateDto, String(user._id));
      },
      'Update Amenity Category',
      'Update Amenity Category',
      'Amenity category updated successfully',
      'Failed to update amenity category',
    );
  }

  @Put(':id/activate')
  @AdminEndpoint(
    'Activate amenity category (System Admin only)',
    'Activates a deactivated amenity category',
    AmenityCategoryResponseDto,
  )
  @ApiParam({ name: 'id', description: 'Category ID' })
  async activate(@Param('id') id: string, @CurrentUser() user: UserDocument) {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        return this.amenityCategoriesService.updateAmenityCategory(
          id,
          { isActive: true },
          String(user._id),
        );
      },
      'Activate Amenity Category',
      'Activate Amenity Category',
      'Amenity category activated successfully',
      'Failed to activate amenity category',
    );
  }

  @Put(':id/deactivate')
  @AdminEndpoint(
    'Deactivate amenity category (System Admin only)',
    'Deactivates an active amenity category',
    AmenityCategoryResponseDto,
  )
  @ApiParam({ name: 'id', description: 'Category ID' })
  async deactivate(@Param('id') id: string, @CurrentUser() user: UserDocument) {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        return this.amenityCategoriesService.updateAmenityCategory(
          id,
          { isActive: false },
          String(user._id),
        );
      },
      'Deactivate Amenity Category',
      'Deactivate Amenity Category',
      'Amenity category deactivated successfully',
      'Failed to deactivate amenity category',
    );
  }

  @Put(':id/deprecate')
  @AdminEndpoint(
    'Deprecate amenity category (System Admin only)',
    'Marks an amenity category as deprecated',
    AmenityCategoryResponseDto,
  )
  @ApiParam({ name: 'id', description: 'Category ID' })
  async deprecate(@Param('id') id: string, @CurrentUser() user: UserDocument) {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        return this.amenityCategoriesService.deprecate(id, String(user._id));
      },
      'Deprecate Amenity Category',
      'Deprecate Amenity Category',
      'Amenity category deprecated successfully',
      'Failed to deprecate amenity category',
    );
  }

  @Delete(':id')
  @AdminEndpoint(
    'Soft delete amenity category (System Admin only)',
    'Performs a soft delete on an amenity category',
    AmenityCategoryDeleteResponseDto,
  )
  @ApiParam({ name: 'id', description: 'Category ID' })
  async delete(@Param('id') id: string, @CurrentUser() user: UserDocument) {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        await this.amenityCategoriesService.softDelete(id, String(user._id));
        return { deleted: true, id };
      },
      'Delete Amenity Category',
      'Delete Amenity Category',
      'Amenity category deleted successfully',
      'Failed to delete amenity category',
    );
  }

  @Put(':id/restore')
  @AdminEndpoint(
    'Restore amenity category (System Admin only)',
    'Restores a previously deleted amenity category',
    AmenityCategoryResponseDto,
  )
  @ApiParam({ name: 'id', description: 'Category ID' })
  async restore(@Param('id') id: string, @CurrentUser() user: UserDocument) {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        return this.amenityCategoriesService.restore(id, String(user._id));
      },
      'Restore Amenity Category',
      'Restore Amenity Category',
      'Amenity category restored successfully',
      'Failed to restore amenity category',
    );
  }
}
