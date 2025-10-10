import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  NotFoundException,
} from '@nestjs/common';
import { ApiParam, ApiQuery, ApiTags, ApiExtraModels } from '@nestjs/swagger';
import { AdminEndpoint } from '../../../common/decorators/api-endpoint.decorator';
import { BaseController } from '../../../common/controllers/base.controller';
import { DynamicConfigService } from '../config.service';
import { CreateConfigDto } from '../dto/create-config.dto';
import { ConfigCategory } from '../../../database/schemas/app-config.schema';
import { ConfigListResponseDto } from '../dto/config-list-response.dto';
import {
  ConfigResponseDto,
  ConfigGroupedResponseDto,
  ConfigDataDto,
} from '../dto/config-response.dto';
import { ConfigDeleteResponseDto, ConfigDeleteDataDto } from '../dto/config-delete-response.dto';

/**
 * Admin Controller for Configuration
 * Handles administrative configuration operations
 */
@ApiTags('Configuration Management')
@ApiExtraModels(
  ConfigDataDto,
  ConfigResponseDto,
  ConfigGroupedResponseDto,
  ConfigListResponseDto,
  ConfigDeleteResponseDto,
  ConfigDeleteDataDto,
)
@Controller('admin/config')
export class ConfigAdminController extends BaseController {
  constructor(private readonly configService: DynamicConfigService) {
    super();
  }

  @Get()
  @AdminEndpoint(
    'Get all configurations, optionally filtered by category (Admin)',
    'Retrieve all system configurations with optional category filtering for administrative management',
    ConfigListResponseDto,
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
  @AdminEndpoint(
    'Get all configurations grouped by category (Admin)',
    'Retrieve system configurations organized by category for administrative overview',
    ConfigGroupedResponseDto,
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
  @AdminEndpoint(
    'Get configurations by specific category (Admin)',
    'Retrieve all configurations for a specific category',
    ConfigListResponseDto,
  )
  @ApiParam({
    name: 'category',
    enum: ConfigCategory,
    description: 'Configuration category',
  })
  async getByCategory(@Param('category') category: ConfigCategory): Promise<ConfigListResponseDto> {
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
  @AdminEndpoint(
    'Get configuration by key (Admin)',
    'Retrieve a specific configuration setting by its unique key',
    ConfigResponseDto,
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

  @Post()
  @AdminEndpoint(
    'Create or update configuration (Admin only)',
    'Create a new configuration setting or update an existing one with administrative privileges',
    ConfigResponseDto,
  )
  async set(@Body() dto: CreateConfigDto): Promise<ConfigResponseDto> {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        return await this.configService.set(
          dto.key,
          dto.value,
          dto.title,
          dto.description,
          dto.category,
          dto.sortOrder,
        );
      },
      'Save configuration',
      'Configuration Saved',
      'Configuration saved successfully',
      'Failed to save configuration',
    );
  }

  @Delete(':key')
  @AdminEndpoint(
    'Delete configuration by key (Admin only)',
    'Permanently delete a configuration setting by its unique key',
    ConfigDeleteResponseDto,
  )
  @ApiParam({ name: 'key', description: 'Configuration key' })
  async delete(@Param('key') key: string): Promise<ConfigDeleteResponseDto> {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        await this.configService.delete(key);
        return { success: true };
      },
      'Delete configuration',
      'Configuration Deleted',
      'Configuration deleted successfully',
      'Failed to delete configuration',
    );
  }
}
