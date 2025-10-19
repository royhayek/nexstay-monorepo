import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { CatalogService } from '../catalog.service';
import { CatalogsResponseDto } from '../dto/catalog-item-response.dto';
import { Public } from '../../../common/decorators/public.decorator';
import { BaseController } from '../../../common/controllers/base.controller';
import { PublicEndpoint } from '../../../common/decorators/api-endpoint.decorator';

@ApiTags('Catalogs (Public)')
@Controller({ path: 'public/catalogs', version: '1' })
export class CatalogPublicController extends BaseController {
  constructor(private readonly catalogService: CatalogService) {
    super();
  }

  @Get()
  @Public()
  @PublicEndpoint(
    'Get all catalogs',
    'Fetch multiple catalog types with optional filtering. Supports versioning for cache invalidation.',
    CatalogsResponseDto,
  )
  @ApiQuery({
    name: 'include',
    required: false,
    description:
      'Comma-separated list of catalog types to include (e.g., PropertyType,RoomType,Amenity). If omitted, returns all types.',
    example: 'PropertyType,RoomType,BedType,Amenity',
  })
  @ApiQuery({
    name: 'locale',
    required: false,
    description: 'Preferred language code for sorting/filtering (not used for filtering currently, labels include all languages)',
    example: 'en',
  })
  async getCatalogs(
    @Query('include') include?: string,
    @Query('locale') locale: string = 'en',
  ): Promise<CatalogsResponseDto> {
    const catalogTypes = include ? include.split(',').map((t) => t.trim()) : undefined;
    const data = await this.catalogService.findAllForFrontend(catalogTypes);

    return this.createSuccessResponse(
      data,
      'Catalogs Retrieved',
      'Catalogs retrieved successfully',
    ) as CatalogsResponseDto;
  }

  @Get('version')
  @Public()
  @PublicEndpoint(
    'Get catalog version',
    'Get current catalog version number for cache invalidation',
  )
  async getVersion() {
    const data = await this.catalogService.getCatalogVersion();
    return this.createSuccessResponse(
      data,
      'Version Retrieved',
      'Catalog version retrieved successfully',
    );
  }
}
