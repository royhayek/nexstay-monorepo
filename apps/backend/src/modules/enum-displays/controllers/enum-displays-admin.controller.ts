import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { ApiTags, ApiParam, ApiExtraModels } from '@nestjs/swagger';
import { BaseController } from '../../../common/controllers/base.controller';
import { EnumDisplaysService } from '../enum-displays.service';
import { CreateEnumDisplayDto } from '../dto/create-enum-display.dto';
import { UpdateEnumDisplayDto } from '../dto/update-enum-display.dto';
import {
  EnumDisplayResponseDto,
  EnumDisplayListResponseDto,
  EnumDisplayGroupsResponseDto,
  EnumDisplayDataDto,
} from '../dto/enum-display-response.dto';
import type { SystemEnumName } from '../../../common/enums/system.enums';
import { ApiEndpoint } from '../../../common/decorators/api-endpoint.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { UserRole } from '../../../database/schemas/user.schema';
import type { UserDocument } from '../../../database/schemas/user.schema';
import { BaseResponseDto } from '../../../common/dto/base-response.dto';

/**
 * Admin Controller for Enum Displays
 * Handles administrative enum display configuration operations
 */
@Controller('admin/enum-displays')
@ApiTags('Enum Displays Management')
@ApiExtraModels(BaseResponseDto, EnumDisplayDataDto)
export class EnumDisplaysAdminController extends BaseController {
  constructor(private readonly enumDisplaysService: EnumDisplaysService) {
    super();
  }

  @Get()
  @ApiEndpoint({
    summary: 'Get all enum display configurations (Admin)',
    auth: {
      required: true,
      roles: [UserRole.SYSTEM_ADMIN, UserRole.ADMIN],
    },
    responses: {
      success: {
        description: 'Enum display configurations retrieved successfully',
        type: EnumDisplayGroupsResponseDto,
      },
      errors: {
        forbidden: 'Admin role required',
      },
    },
  })
  async findAll() {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        return await this.enumDisplaysService.findAll();
      },
      'Get all enum displays',
      'Enum Display Management',
      'Enum display configurations retrieved successfully',
      'Failed to retrieve enum display configurations',
    );
  }

  @Get(':enumName')
  @ApiEndpoint({
    summary: 'Get display configurations for a specific enum (Admin)',
    auth: {
      required: true,
      roles: [UserRole.SYSTEM_ADMIN, UserRole.ADMIN, UserRole.MODERATOR],
    },
    responses: {
      success: {
        description: 'Enum display configurations retrieved successfully',
        type: EnumDisplayListResponseDto,
      },
      errors: {
        forbidden: 'Admin/Moderator role required',
      },
    },
  })
  @ApiParam({
    name: 'enumName',
    description: 'System enum name',
    example: 'UserRole',
  })
  async findByEnumName(@Param('enumName') enumName: SystemEnumName) {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        return await this.enumDisplaysService.findByEnumName(enumName);
      },
      'Get enum display configurations by name',
      'Enum Configuration List',
      'Enum display configurations retrieved successfully',
      'Failed to retrieve enum display configurations',
    );
  }

  @Get('id/:id')
  @ApiEndpoint({
    summary: 'Get display configuration by ID (Admin)',
    auth: {
      required: true,
      roles: [UserRole.SYSTEM_ADMIN, UserRole.ADMIN, UserRole.MODERATOR],
    },
    responses: {
      success: {
        description: 'Enum display configuration retrieved successfully',
        type: EnumDisplayResponseDto,
      },
      errors: {
        forbidden: 'Admin/Moderator role required',
        notFound: 'Enum display configuration not found',
      },
    },
  })
  @ApiParam({ name: 'id', description: 'Enum display ID' })
  async findById(@Param('id') id: string) {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        return await this.enumDisplaysService.findById(id);
      },
      'Get enum display configuration by ID',
      'Enum Display Details',
      'Enum display configuration retrieved successfully',
      'Failed to retrieve enum display configuration',
    );
  }

  @Get(':enumName/:key')
  @ApiEndpoint({
    summary: 'Get display configuration for a specific enum key (Admin)',
    auth: {
      required: true,
      roles: [UserRole.SYSTEM_ADMIN, UserRole.ADMIN, UserRole.MODERATOR],
    },
    responses: {
      success: {
        description: 'Enum display configuration retrieved successfully',
        type: EnumDisplayResponseDto,
      },
      errors: {
        forbidden: 'Admin/Moderator role required',
        notFound: 'Enum display configuration not found',
      },
    },
  })
  @ApiParam({
    name: 'enumName',
    description: 'System enum name',
    example: 'UserRole',
  })
  @ApiParam({
    name: 'key',
    description: 'Enum key',
    example: 'ADMIN',
  })
  async findByKey(@Param('enumName') enumName: SystemEnumName, @Param('key') key: string) {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        return await this.enumDisplaysService.findByKey(enumName, key);
      },
      'Get enum display configuration by key',
      'Enum Key Configuration',
      'Enum display configuration retrieved successfully',
      'Failed to retrieve enum display configuration',
    );
  }

  @Post()
  @ApiEndpoint({
    summary: 'Create enum display configuration (System Admin only)',
    auth: {
      required: true,
      roles: [UserRole.SYSTEM_ADMIN],
    },
    responses: {
      success: {
        status: 201,
        description: 'Enum display configuration created successfully',
        type: EnumDisplayResponseDto,
      },
      errors: {
        badRequest: 'Invalid request data',
        forbidden: 'System Admin role required',
      },
    },
  })
  async create(@Body() createDto: CreateEnumDisplayDto, @CurrentUser() user: UserDocument) {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        return await this.enumDisplaysService.create(createDto, String(user._id));
      },
      'Create enum display configuration',
      'Enum Display Created',
      'Enum display configuration created successfully',
      'Failed to create enum display configuration',
    );
  }

  @Put(':enumName/:key')
  @ApiEndpoint({
    summary: 'Update enum display configuration (System Admin only)',
    auth: {
      required: true,
      roles: [UserRole.SYSTEM_ADMIN],
    },
    responses: {
      success: {
        description: 'Enum display configuration updated successfully',
        type: EnumDisplayResponseDto,
      },
      errors: {
        badRequest: 'Invalid request data',
        forbidden: 'System Admin role required',
        notFound: 'Enum display configuration not found',
      },
    },
  })
  @ApiParam({
    name: 'enumName',
    description: 'System enum name',
    example: 'UserRole',
  })
  @ApiParam({
    name: 'key',
    description: 'Enum key',
    example: 'ADMIN',
  })
  async update(
    @Param('enumName') enumName: SystemEnumName,
    @Param('key') key: string,
    @Body() updateDto: UpdateEnumDisplayDto,
    @CurrentUser() user: UserDocument,
  ) {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        return await this.enumDisplaysService.update(enumName, key, updateDto, String(user._id));
      },
      'Update enum display configuration',
      'Enum Display Updated',
      'Enum display configuration updated successfully',
      'Failed to update enum display configuration',
    );
  }

  @Delete(':enumName/:key')
  @ApiEndpoint({
    summary: 'Delete enum display configuration (System Admin only)',
    auth: {
      required: true,
      roles: [UserRole.SYSTEM_ADMIN],
    },
    responses: {
      success: {
        description: 'Enum display configuration deleted successfully',
      },
      errors: {
        forbidden: 'System Admin role required',
        notFound: 'Enum display configuration not found',
      },
    },
  })
  @ApiParam({
    name: 'enumName',
    description: 'System enum name',
    example: 'UserRole',
  })
  @ApiParam({
    name: 'key',
    description: 'Enum key',
    example: 'ADMIN',
  })
  async delete(
    @Param('enumName') enumName: SystemEnumName,
    @Param('key') key: string,
    @CurrentUser() user: UserDocument,
  ) {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        await this.enumDisplaysService.delete(enumName, key, String(user._id));
        return { deleted: true };
      },
      'Delete enum display configuration',
      'Enum Display Deleted',
      'Enum display configuration deleted successfully',
      'Failed to delete enum display configuration',
    );
  }
}
