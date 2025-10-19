import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiQuery } from '@nestjs/swagger';
import { CatalogService } from '../catalog.service';
import { CreateCatalogItemDto } from '../dto/create-catalog-item.dto';
import { UpdateCatalogItemDto } from '../dto/update-catalog-item.dto';
import {
  CatalogItemResponseDto,
  CatalogItemListResponseDto,
} from '../dto/catalog-item-response.dto';
import { BaseController } from '../../../common/controllers/base.controller';
import { ProtectedEndpoint } from '../../../common/decorators/api-endpoint.decorator';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { UserRole } from '../../../database/schemas/user.schema';

@ApiTags('Catalogs - Admin')
@Controller({ path: 'admin/catalogs', version: '1' })
@UseGuards(RolesGuard)
@Roles(UserRole.ADMIN)
export class CatalogAdminController extends BaseController {
  constructor(private readonly catalogService: CatalogService) {
    super();
  }

  @Get()
  @ApiQuery({
    name: 'catalogType',
    required: false,
    description:
      'Filter by catalog type. Supports single type (e.g., "PropertyType") or comma-separated multiple types (e.g., "PropertyType,RoomType,BedType")',
    example: 'PropertyType,RoomType,BedType',
  })
  @ProtectedEndpoint(
    'List catalog items',
    'Get paginated list of catalog items with search and filters. Supports fetching multiple catalog types at once using comma-separated values.',
    CatalogItemListResponseDto,
  )
  async findAll(
    @Query('catalogType') catalogType?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('group') group?: string,
    @Query('isActive') isActive?: boolean,
    @Query('includeDeleted') includeDeleted?: boolean,
  ): Promise<CatalogItemListResponseDto> {
    const data = await this.catalogService.findWithPagination({
      catalogType,
      page,
      limit,
      search,
      group,
      isActive,
      includeDeleted,
    });

    return this.createSuccessResponse(
      data,
      'Catalog Items Retrieved',
      'Catalog items retrieved successfully',
    ) as CatalogItemListResponseDto;
  }

  @Get(':id')
  @ProtectedEndpoint(
    'Get catalog item by ID',
    'Retrieve a single catalog item',
    CatalogItemResponseDto,
  )
  async findOne(@Param('id') id: string): Promise<CatalogItemResponseDto> {
    const item = await this.catalogService.findById(id);
    if (!item) {
      throw new NotFoundException(`Catalog item with ID "${id}" not found`);
    }

    return this.createSuccessResponse(
      item,
      'Catalog Item Retrieved',
      'Catalog item retrieved successfully',
    ) as CatalogItemResponseDto;
  }

  @Post()
  @ProtectedEndpoint(
    'Create catalog item',
    'Create a new catalog item with icon support',
    CatalogItemResponseDto,
  )
  async create(
    @Body() createDto: CreateCatalogItemDto,
    @Request() req: any,
  ): Promise<CatalogItemResponseDto> {
    const userId = req.user?.userId;
    const item = await this.catalogService.create(createDto, userId);

    return this.createSuccessResponse(
      item,
      'Catalog Item Created',
      'Catalog item created successfully',
    ) as CatalogItemResponseDto;
  }

  @Patch(':id')
  @ProtectedEndpoint(
    'Update catalog item',
    'Update an existing catalog item',
    CatalogItemResponseDto,
  )
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateCatalogItemDto,
    @Request() req: any,
  ): Promise<CatalogItemResponseDto> {
    const userId = req.user?.userId;
    const item = await this.catalogService.update(id, updateDto, userId);

    return this.createSuccessResponse(
      item,
      'Catalog Item Updated',
      'Catalog item updated successfully',
    ) as CatalogItemResponseDto;
  }

  @Delete(':id')
  @ProtectedEndpoint(
    'Delete catalog item',
    'Soft delete a catalog item',
  )
  async remove(@Param('id') id: string, @Request() req: any) {
    const userId = req.user?.userId;
    await this.catalogService.softDelete(id, userId);

    return this.createSuccessResponse(
      null,
      'Catalog Item Deleted',
      'Catalog item deleted successfully',
    );
  }

  @Post(':id/restore')
  @ProtectedEndpoint(
    'Restore catalog item',
    'Restore a soft-deleted catalog item',
    CatalogItemResponseDto,
  )
  async restore(@Param('id') id: string, @Request() req: any): Promise<CatalogItemResponseDto> {
    const userId = req.user?.userId;
    const item = await this.catalogService.restore(id, userId);

    return this.createSuccessResponse(
      item,
      'Catalog Item Restored',
      'Catalog item restored successfully',
    ) as CatalogItemResponseDto;
  }
}
