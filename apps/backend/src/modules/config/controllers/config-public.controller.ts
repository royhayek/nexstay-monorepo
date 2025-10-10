import { Controller, Get, Param, Query, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiParam, ApiQuery } from '@nestjs/swagger';
import { PublicEndpoint } from '../../../common/decorators/api-endpoint.decorator';
import { BaseController } from '../../../common/controllers/base.controller';
import { DynamicConfigService } from '../config.service';
import { ConfigResponseDto, ConfigGroupedResponseDto } from '../dto/config-response.dto';
import { ConfigListResponseDto } from '../dto/config-list-response.dto';
import { ConfigCategory } from '../../../database/schemas/app-config.schema';
import { ConfigListResponse } from '../interfaces/config-controller.interfaces';

/**
 * Public Controller for Configuration
 * Handles public access to configuration data without authentication
 */
@Controller('public/config')
@ApiTags('Configuration (Public)')
export class ConfigPublicController extends BaseController {
  constructor(private readonly configService: DynamicConfigService) {
    super();
  }

  @Get()
  @PublicEndpoint(
    'Get all configurations, optionally filtered by category',
    'Retrieve all system configurations with optional category filtering',
  )
  @ApiQuery({
    name: 'category',
    required: false,
    enum: ConfigCategory,
    description: 'Filter configurations by category',
  })
  async getAll(@Query('category') category?: ConfigCategory): Promise<ConfigListResponseDto> {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        return await this.configService.getAll(category);
      },
      'Get all configurations',
      'Configurations Retrieved',
      'Configurations retrieved successfully',
      'Failed to retrieve configurations',
    );
  }

  @Get('grouped')
  @PublicEndpoint(
    'Get all configurations grouped by category',
    'Retrieve all system configurations organized by their respective categories',
  )
  async getAllGroupedByCategory(): Promise<ConfigGroupedResponseDto> {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        return await this.configService.getAllGroupedByCategory();
      },
      'Get configurations grouped by category',
      'Grouped Configurations Retrieved',
      'Grouped configurations retrieved successfully',
      'Failed to retrieve grouped configurations',
    );
  }

  @Get('category/:category')
  @PublicEndpoint(
    'Get configurations by specific category',
    'Retrieve all configurations that belong to a specific category',
  )
  @ApiParam({
    name: 'category',
    enum: ConfigCategory,
    description: 'Configuration category',
  })
  async getByCategory(@Param('category') category: ConfigCategory): Promise<ConfigListResponse> {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        return await this.configService.getByCategory(category);
      },
      'Get configurations by category',
      'Category Configurations Retrieved',
      'Category configurations retrieved successfully',
      'Failed to retrieve configurations by category',
    );
  }

  @Get(':key')
  @PublicEndpoint(
    'Get configuration by key',
    'Retrieve a specific configuration setting by its unique key',
  )
  @ApiParam({ name: 'key', description: 'Configuration key' })
  async get(@Param('key') key: string): Promise<ConfigResponseDto> {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        const config = await this.configService.getByKey(key);
        if (!config) {
          throw new NotFoundException(`Config with key "${key}" not found`);
        }
        return config;
      },
      'Get configuration by key',
      'Configuration Retrieved',
      'Configuration retrieved successfully',
      'Failed to retrieve configuration',
    );
  }
}
