import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiParam, ApiQuery } from '@nestjs/swagger';
import { PublicEndpoint } from '../../../common/decorators/api-endpoint.decorator';
import { BaseController } from '../../../common/controllers/base.controller';
import { AmenityCategoriesService } from '../amenity-categories.service';

/**
 * Public Controller for Amenity Categories
 * Handles public amenity category access operations
 */
@Controller('public/amenity-categories')
@ApiTags('Amenity Categories (Public)')
export class AmenityCategoriesPublicController extends BaseController {
  constructor(private readonly amenityCategoriesService: AmenityCategoriesService) {
    super();
  }

  @Get()
  @PublicEndpoint(
    'Get all amenity categories (Public, optimized)',
    'Retrieve a paginated list of all amenity categories with frontend-optimized fields',
  )
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Search term' })
  @ApiQuery({ name: 'group', required: false, type: String, description: 'Category group' })
  @ApiQuery({
    name: 'isActive',
    required: false,
    type: Boolean,
    description: 'Filter by active status (defaults to true)',
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
        return this.amenityCategoriesService.findAllForFrontend({
          page,
          limit,
          search,
          group,
          isActive: isActive !== undefined ? isActive : true, // Default to true if not specified
        });
      },
      'Get All Amenity Categories (Public)',
      'Amenity Categories List',
      'Amenity categories retrieved successfully',
      'Failed to retrieve amenity categories',
    );
  }

  @Get(':id')
  @PublicEndpoint(
    'Get amenity category by ID (Public, optimized)',
    'Retrieve a specific amenity category with frontend-optimized fields',
  )
  @ApiParam({ name: 'id', description: 'Category ID' })
  async findById(@Param('id') id: string) {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        return this.amenityCategoriesService.findByIdForFrontend(id);
      },
      'Get Amenity Category by ID (Public)',
      'Get Amenity Category',
      'Amenity category retrieved successfully',
      'Failed to retrieve amenity category',
    );
  }
}
