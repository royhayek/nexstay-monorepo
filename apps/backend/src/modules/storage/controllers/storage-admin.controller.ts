import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Query,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { ApiTags, ApiQuery, ApiBody, ApiExtraModels } from '@nestjs/swagger';
import { BaseController } from '../../../common/controllers/base.controller';
import { AdminEndpoint } from '../../../common/decorators/api-endpoint.decorator';
import { S3Service } from '../services/s3.service';
import type { FileDeleteRequest, FileBulkDeleteRequest } from '../interfaces/storage.interfaces';
import {
  FilesListResponseDto,
  StorageStatisticsResponseDto,
  AdminFileDeleteResponseDto,
  FileCleanupResponseDto,
  StorageUsageByUserResponseDto,
} from '../dto/storage-admin-response.dto';

/**
 * Admin Controller for Storage
 * Handles administrative storage operations and file management
 */
@Controller('admin/storage')
@ApiTags('Storage Management')
@ApiExtraModels(
  FilesListResponseDto,
  StorageStatisticsResponseDto,
  AdminFileDeleteResponseDto,
  FileCleanupResponseDto,
  StorageUsageByUserResponseDto,
)
export class StorageAdminController extends BaseController {
  constructor(private readonly s3Service: S3Service) {
    super();
  }

  @Get('files')
  @AdminEndpoint(
    'Get all files with filters (Admin/Moderator only)',
    'Retrieve all uploaded files with category, user, and pagination filters for administrative file management',
    FilesListResponseDto,
  )
  @ApiQuery({
    name: 'category',
    required: false,
    enum: ['PROFILE_IMAGES', 'PROPERTY_IMAGES', 'DOCUMENTS', 'TEMP'],
    description: 'Filter by file category',
  })
  @ApiQuery({
    name: 'userId',
    required: false,
    type: String,
    description: 'Filter by user ID',
  })
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
    description: 'Items per page (default: 50)',
  })
  async getAllFiles(
    @Query('category') _category?: string,
    @Query('userId') _userId?: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number = 1,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) _limit: number = 50,
  ) {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        // Admin file listing implementation placeholder - requires S3 SDK integration
        return Promise.resolve({
          files: [],
          total: 0,
          page,
          totalPages: 0,
          message: 'Admin file listing - implementation pending S3 list-objects integration',
        });
      },
      'Get all files',
      'Admin Files Management',
      'Files retrieved successfully',
      'Failed to retrieve files',
    );
  }

  @Get('statistics')
  @AdminEndpoint(
    'Get storage statistics (Admin only)',
    'Retrieve comprehensive storage usage statistics including file counts, sizes, and category breakdowns',
    StorageStatisticsResponseDto,
  )
  async getStorageStatistics() {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        // Storage statistics implementation placeholder - requires S3 analytics
        return Promise.resolve({
          totalFiles: 0,
          totalSize: 0,
          categoryBreakdown: {},
          message: 'Storage statistics - implementation pending S3 analytics integration',
        });
      },
      'Get storage statistics',
      'Storage Analytics Overview',
      'Storage statistics retrieved successfully',
      'Failed to retrieve storage statistics',
    );
  }

  @Delete('file')
  @AdminEndpoint(
    'Delete file by URL (Admin only)',
    'Permanently delete a file from storage using its URL with optional reason tracking',
    AdminFileDeleteResponseDto,
  )
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          description: 'File URL to delete',
        },
        reason: {
          type: 'string',
          description: 'Reason for deletion',
        },
      },
      required: ['url'],
    },
  })
  async deleteFileByAdmin(@Body() body: FileDeleteRequest) {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        // Admin file deletion - S3 integration implemented
        await this.s3Service.deleteFile(body.url);
        return { deleted: true };
      },
      'Delete file by admin',
      'Admin File Deletion',
      'File deleted successfully',
      'Failed to delete file',
    );
  }

  @Post('cleanup')
  @AdminEndpoint(
    'Clean up orphaned files (Admin only)',
    'Remove orphaned and outdated files with dry-run support for safe cleanup operations',
    FileCleanupResponseDto,
  )
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        category: {
          type: 'string',
          enum: ['PROFILE_IMAGES', 'PROPERTY_IMAGES', 'DOCUMENTS', 'TEMP'],
          description: 'Category to clean up (optional)',
        },
        daysOld: {
          type: 'number',
          description: 'Delete files older than X days (default: 30)',
        },
        dryRun: {
          type: 'boolean',
          description: 'Preview cleanup without actually deleting (default: true)',
        },
      },
    },
  })
  async cleanupOrphanedFiles(@Body() body: FileBulkDeleteRequest) {
    return this.executeWithErrorHandlingAndMessage(
      () => {
        // Orphaned file cleanup implementation placeholder - requires database-S3 reconciliation
        return {
          cleaned: 0,
          totalSize: 0,
          files: [],
          dryRun: body.dryRun !== false,
          message: 'File cleanup - implementation pending database-S3 reconciliation',
        };
      },
      'Cleanup orphaned files',
      'File Cleanup Process',
      'Cleanup completed successfully',
      'Failed to cleanup files',
    );
  }

  @Get('usage/by-user')
  @AdminEndpoint(
    'Get storage usage by user (Admin only)',
    'Retrieve detailed storage usage statistics grouped by user with pagination support',
    StorageUsageByUserResponseDto,
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
    description: 'Items per page (default: 20)',
  })
  async getStorageUsageByUser(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number = 1,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) _limit: number = 20,
  ) {
    return this.executeWithErrorHandlingAndMessage(
      () => {
        // Storage usage by user implementation placeholder - requires S3 analytics by prefix
        return {
          users: [],
          total: 0,
          page,
          totalPages: 0,
          message: 'Storage usage by user - implementation pending S3 analytics integration',
        };
      },
      'Get storage usage by user',
      'Storage Usage by User',
      'Storage usage by user retrieved successfully',
      'Failed to retrieve storage usage',
    );
  }
}
