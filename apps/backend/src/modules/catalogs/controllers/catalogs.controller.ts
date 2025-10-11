import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { CatalogsService } from '../catalogs.service';
import { CatalogResponseDto } from '../dto/catalog-response.dto';
import { CatalogVersionResponseDto } from '../dto/catalog-version-response.dto';
import { Public } from '../../../common/decorators/public.decorator';
import { BaseController } from '../../../common/controllers/base.controller';

@ApiTags('Catalogs')
@Controller({ path: 'catalogs', version: '1' })
export class CatalogsController extends BaseController {
  constructor(private readonly catalogsService: CatalogsService) {
    super();
  }

  @Get()
  @Public()
  @ApiOperation({ summary: 'Get catalogs with versioning and caching support' })
  @ApiQuery({
    name: 'include',
    required: false,
    description:
      'Comma-separated list of catalogs to include: currencies,enumDisplays,amenityCategories,amenities,bedTypes,propertyTypes,roomTypes,cancellationPolicies,notificationTypes,paymentProviders',
    example:
      'currencies,enumDisplays,amenityCategories,bedTypes,propertyTypes,roomTypes,cancellationPolicies',
  })
  @ApiQuery({
    name: 'locale',
    required: false,
    description: 'Locale for internationalized content',
    example: 'en',
  })
  async getCatalogs(
    @Query('include') include?: string,
    @Query('locale') locale: string = 'en',
  ): Promise<CatalogResponseDto> {
    const includes = include ? include.split(',').map((i) => i.trim()) : [];
    const data = await this.catalogsService.getCatalogs(includes, locale);

    return this.createSuccessResponse(
      data,
      'Catalogs Retrieved',
      'Catalogs retrieved successfully',
    ) as CatalogResponseDto;
  }

  @Get('version')
  @Public()
  @ApiOperation({ summary: 'Get catalog version' })
  async getVersion(): Promise<CatalogVersionResponseDto> {
    const data = await this.catalogsService.getCatalogVersion();
    return this.createSuccessResponse(
      data,
      'Version Retrieved',
      'Catalog version retrieved successfully',
    ) as CatalogVersionResponseDto;
  }
}
