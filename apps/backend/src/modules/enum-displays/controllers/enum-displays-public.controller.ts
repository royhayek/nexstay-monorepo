import { Controller, Get, Param } from '@nestjs/common';
import { ApiExtraModels, ApiParam, ApiTags } from '@nestjs/swagger';
import { PublicEndpoint } from '../../../common/decorators/api-endpoint.decorator';
import { BaseController } from '../../../common/controllers/base.controller';
import { EnumDisplaysService } from '../enum-displays.service';
import type { SystemEnumName } from '../../../common/enums/system.enums';
import { BaseResponseDto } from '../../../common/dto/base-response.dto';
import { EnumDisplayDataDto } from '../dto/enum-display-response.dto';

/**
 * Public Controller for Enum Displays
 * Handles public access to enum display configurations without authentication
 */
@Controller('public/enum-displays')
@ApiTags('Enum Displays (Public)')
@ApiExtraModels(BaseResponseDto, EnumDisplayDataDto)
export class EnumDisplaysPublicController extends BaseController {
  constructor(private readonly enumDisplaysService: EnumDisplaysService) {
    super();
  }

  @Get()
  @PublicEndpoint(
    'Get all enum display configurations (public, optimized)',
    'Retrieve all enum display configurations with frontend-optimized grouping',
  )
  async findAll() {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        return await this.enumDisplaysService.findAllForFrontend();
      },
      'Get all enum displays',
      'Enum Displays',
      'Enum display configurations retrieved successfully',
      'Failed to retrieve enum display configurations',
    );
  }

  @Get('id/:id')
  @PublicEndpoint(
    'Get display configuration by ID (public, optimized)',
    'Retrieve a specific enum display configuration by its unique identifier',
  )
  @ApiParam({ name: 'id', description: 'Enum display ID' })
  async findById(@Param('id') id: string) {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        return await this.enumDisplaysService.findByIdForFrontend(id);
      },
      'Get enum display configuration by ID',
      'Enum Display Details',
      'Enum display configuration retrieved successfully',
      'Failed to retrieve enum display configuration',
    );
  }

  @Get(':enumName')
  @PublicEndpoint(
    'Get display configurations for a specific enum (public, optimized)',
    'Retrieve display configurations for a specific system enum with localized labels',
  )
  @ApiParam({
    name: 'enumName',
    description: 'System enum name',
    example: 'UserRole',
  })
  async findByEnumName(@Param('enumName') enumName: SystemEnumName) {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        return await this.enumDisplaysService.findByEnumNameForFrontend(enumName);
      },
      'Get enum display configurations by name',
      'Enum Configuration',
      'Enum display configurations retrieved successfully',
      'Failed to retrieve enum display configurations',
    );
  }
}
