import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  ParseIntPipe,
  DefaultValuePipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiQuery, ApiParam } from '@nestjs/swagger';
import { PublicEndpoint } from '../../../common/decorators/api-endpoint.decorator';
import { plainToInstance } from 'class-transformer';
import { BaseController } from '../../../common/controllers/base.controller';
import { PropertySearchDto } from '../dto/property-search.dto';
import {
  PropertyResponseDto,
  PropertyListResponseDto,
  SinglePropertyResponseDto,
  PropertyArrayResponseDto,
} from '../dto/property-response.dto';
import { PaginatedDto } from '../../../common/dto/paginated.dto';
import { PropertiesFacadeService } from '../services/properties-facade.service';
import { PropertySearchWithFiltersResponseDto } from '../dto/property-search-with-filters-response.dto';

/**
 * Public Controller for Properties
 * Handles publicly accessible property operations
 */
@Controller('public/properties')
@ApiTags('Properties (Public)')
export class PropertiesPublicController extends BaseController {
  constructor(private readonly propertiesFacade: PropertiesFacadeService) {
    super();
  }

  @Post('search')
  @HttpCode(HttpStatus.OK)
  @PublicEndpoint(
    'Search properties with advanced filters',
    'Search properties using comprehensive filtering options including location, price, dates, and amenities',
    PropertyListResponseDto,
  )
  async search(@Body() searchDto: PropertySearchDto): Promise<PropertyListResponseDto> {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        // Validate pagination parameters
        if (searchDto.page) {
          searchDto.page = Math.max(1, searchDto.page);
        }
        if (searchDto.limit) {
          searchDto.limit = Math.min(Math.max(1, searchDto.limit), 100);
        }

        const result = await this.propertiesFacade.search(searchDto);

        const data: PaginatedDto<PropertyResponseDto> = {
          items: result.items.map((property) => plainToInstance(PropertyResponseDto, property)),
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: result.totalPages,
          hasNextPage: result.hasNextPage,
          hasPrevPage: result.hasPrevPage,
        };

        return data;
      },
      'Search properties',
      'Properties Search Completed',
      'Properties search completed successfully',
      'Failed to search properties',
    );
  }

  @Post('search/with-filters')
  @HttpCode(HttpStatus.OK)
  @PublicEndpoint(
    'Search properties with filter options included',
    'Search properties and retrieve available filter options from catalog in a single request. ' +
      'This endpoint demonstrates the usage of catalogService.findAllForFrontend() to dynamically fetch ' +
      'PropertyType, RoomType, BedType, and CancellationPolicy options from the database.',
    PropertySearchWithFiltersResponseDto,
  )
  async searchWithFilters(
    @Body() searchDto: PropertySearchDto,
  ): Promise<PropertySearchWithFiltersResponseDto> {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        // Validate pagination parameters
        if (searchDto.page) {
          searchDto.page = Math.max(1, searchDto.page);
        }
        if (searchDto.limit) {
          searchDto.limit = Math.min(Math.max(1, searchDto.limit), 100);
        }

        const { results, filterOptions } = await this.propertiesFacade.searchWithFilterOptions(
          searchDto,
        );

        return {
          results: {
            items: results.items.map((property) => plainToInstance(PropertyResponseDto, property)),
            total: results.total,
            page: results.page,
            limit: results.limit,
            totalPages: results.totalPages,
            hasNextPage: results.hasNextPage,
            hasPrevPage: results.hasPrevPage,
          },
          filterOptions,
        };
      },
      'Search properties with filter options',
      'Search Completed with Filters',
      'Properties search completed with available filter options',
      'Failed to search properties with filter options',
    );
  }

  @Get('search/filter-options')
  @PublicEndpoint(
    'Get available search filter options',
    'Retrieve available filter options for property search from the catalog system. ' +
      'Returns PropertyType, RoomType, BedType, and CancellationPolicy options dynamically from the database.',
  )
  async getSearchFilterOptions() {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        return await this.propertiesFacade.getSearchFilterOptions();
      },
      'Get search filter options',
      'Filter Options Retrieved',
      'Search filter options retrieved successfully from catalog',
      'Failed to retrieve search filter options',
    );
  }

  @Get()
  @PublicEndpoint(
    'Get all public properties with pagination',
    'Retrieve a paginated list of all publicly available properties with optional filters',
    PropertyListResponseDto,
  )
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (default: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page (default: 20, max: 100)',
  })
  @ApiQuery({ name: 'location', required: false, type: String, description: 'Filter by location' })
  @ApiQuery({
    name: 'propertyType',
    required: false,
    type: String,
    description: 'Filter by property type',
  })
  @ApiQuery({
    name: 'minPrice',
    required: false,
    type: Number,
    description: 'Minimum price per night',
  })
  @ApiQuery({
    name: 'maxPrice',
    required: false,
    type: Number,
    description: 'Maximum price per night',
  })
  async findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('location') _location?: string,
    @Query('propertyType') _propertyType?: string,
    @Query('minPrice') _minPrice?: number,
    @Query('maxPrice') _maxPrice?: number,
  ): Promise<PropertyListResponseDto> {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        const result = await this.propertiesFacade.findAll(
          Math.max(1, page),
          Math.min(Math.max(1, limit), 100),
        );

        const data: PaginatedDto<PropertyResponseDto> = {
          items: result.items.map((property) =>
            plainToInstance(PropertyResponseDto, property.toObject()),
          ),
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: result.totalPages,
          hasNextPage: result.hasNextPage,
          hasPrevPage: result.hasPrevPage,
        };

        return data;
      },
      'Get public properties',
      'Properties Retrieved',
      'Properties retrieved successfully',
      'Failed to retrieve properties',
    );
  }

  @Get(':id')
  @PublicEndpoint(
    'Get property details by ID',
    'Retrieve detailed information about a specific property including amenities, images, and location',
    SinglePropertyResponseDto,
  )
  @ApiParam({ name: 'id', description: 'Property ID' })
  async findOne(@Param('id') id: string): Promise<SinglePropertyResponseDto> {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        const property = await this.propertiesFacade.findById(id);
        return plainToInstance(PropertyResponseDto, property.toObject(), {
          enableImplicitConversion: true,
        });
      },
      'Get property details',
      'Property Retrieved',
      'Property retrieved successfully',
      'Failed to retrieve property',
    );
  }

  @Get('featured/properties')
  @PublicEndpoint(
    'Get featured properties',
    'Retrieve a list of featured properties highlighted by the platform',
    PropertyArrayResponseDto,
  )
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of featured properties (default: 10, max: 50)',
  })
  async getFeaturedProperties(
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ): Promise<PropertyArrayResponseDto> {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        const properties = await this.propertiesFacade.getFeatured(
          Math.min(Math.max(1, limit), 50),
        );
        return properties.map((property) =>
          plainToInstance(PropertyResponseDto, property.toObject()),
        );
      },
      'Get featured properties',
      'Featured Properties Retrieved',
      'Featured properties retrieved successfully',
      'Failed to retrieve featured properties',
    );
  }

  @Get('nearby/:id')
  @PublicEndpoint(
    'Get nearby properties',
    'Find properties within a specified radius of a given property location',
    PropertyArrayResponseDto,
  )
  @ApiParam({ name: 'id', description: 'Property ID to find nearby properties' })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of nearby properties (default: 5, max: 20)',
  })
  @ApiQuery({
    name: 'radius',
    required: false,
    type: Number,
    description: 'Search radius in kilometers (default: 10)',
  })
  async getNearbyProperties(
    @Param('id') id: string,
    @Query('limit', new DefaultValuePipe(5), ParseIntPipe) limit: number,
    @Query('radius', new DefaultValuePipe(10), ParseIntPipe) radius: number,
  ): Promise<PropertyArrayResponseDto> {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        const property = await this.propertiesFacade.findById(id);
        const [longitude, latitude] = property.location.coordinates;

        const properties = await this.propertiesFacade.searchByLocation(
          latitude,
          longitude,
          Math.min(Math.max(1, radius), 100),
          Math.min(Math.max(1, limit), 20),
        );
        return properties.map((property) =>
          plainToInstance(PropertyResponseDto, property.toObject()),
        );
      },
      'Get nearby properties',
      'Nearby Properties Retrieved',
      'Nearby properties retrieved successfully',
      'Failed to retrieve nearby properties',
    );
  }
}
