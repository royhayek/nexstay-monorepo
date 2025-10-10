import { ApiProperty } from '@nestjs/swagger';
import { BaseResponseDto } from '../../../common/dto/base-response.dto';

// File data structure for admin file listings
export class AdminFileDataDto {
  @ApiProperty({
    description: 'File key/path',
    example: 'profile-images/user123/2024-08-10/uuid-profile.jpg',
  })
  key: string;

  @ApiProperty({
    description: 'File URL',
    example: 'https://bucket.s3.amazonaws.com/profile-images/user123/uuid-profile.jpg',
  })
  url: string;

  @ApiProperty({
    description: 'File size in bytes',
    example: 2048576,
  })
  size: number;

  @ApiProperty({
    description: 'File upload date',
    example: '2024-08-10T10:30:00Z',
  })
  lastModified: Date;

  @ApiProperty({
    description: 'File category',
    example: 'PROFILE_IMAGES',
  })
  category: string;

  @ApiProperty({
    description: 'User ID who uploaded the file',
    example: '507f1f77bcf86cd799439011',
  })
  userId?: string;
}

// Files list response data
export class FilesListDataDto {
  @ApiProperty({
    description: 'Array of files',
    type: [AdminFileDataDto],
  })
  files: AdminFileDataDto[];

  @ApiProperty({
    description: 'Total number of files',
    example: 250,
  })
  total: number;

  @ApiProperty({
    description: 'Current page number',
    example: 1,
  })
  page: number;

  @ApiProperty({
    description: 'Total number of pages',
    example: 13,
  })
  totalPages: number;

  @ApiProperty({
    description: 'Optional message',
    example: 'Files retrieved successfully',
  })
  message?: string;
}

export class FilesListResponseDto extends BaseResponseDto<FilesListDataDto> {
  @ApiProperty({
    description: 'Files list data',
    type: FilesListDataDto,
  })
  declare data: FilesListDataDto;
}

// Storage statistics response data
export class StorageStatisticsDataDto {
  @ApiProperty({
    description: 'Total number of files',
    example: 1250,
  })
  totalFiles: number;

  @ApiProperty({
    description: 'Total storage size in bytes',
    example: 5368709120,
  })
  totalSize: number;

  @ApiProperty({
    description: 'File breakdown by category',
    example: {
      PROFILE_IMAGES: 450,
      PROPERTY_IMAGES: 680,
      DOCUMENTS: 120,
    },
  })
  categoryBreakdown: Record<string, number>;

  @ApiProperty({
    description: 'Optional message',
    example: 'Storage statistics retrieved successfully',
  })
  message?: string;
}

export class StorageStatisticsResponseDto extends BaseResponseDto<StorageStatisticsDataDto> {
  @ApiProperty({
    description: 'Storage statistics data',
    type: StorageStatisticsDataDto,
  })
  declare data: StorageStatisticsDataDto;
}

// File deletion response data
export class AdminFileDeleteDataDto {
  @ApiProperty({
    description: 'Indicates if the delete operation was successful',
    example: true,
  })
  deleted: boolean;
}

export class AdminFileDeleteResponseDto extends BaseResponseDto<AdminFileDeleteDataDto> {
  @ApiProperty({
    description: 'File delete operation result',
    type: AdminFileDeleteDataDto,
  })
  declare data: AdminFileDeleteDataDto;
}

// File cleanup response data
export class FileCleanupDataDto {
  @ApiProperty({
    description: 'Number of files cleaned',
    example: 25,
  })
  cleaned: number;

  @ApiProperty({
    description: 'Total size of cleaned files in bytes',
    example: 134217728,
  })
  totalSize: number;

  @ApiProperty({
    description: 'List of cleaned file keys',
    example: ['temp/old-file-1.jpg', 'temp/old-file-2.png'],
  })
  files: string[];

  @ApiProperty({
    description: 'Whether this was a dry run',
    example: true,
  })
  dryRun: boolean;

  @ApiProperty({
    description: 'Optional message',
    example: 'File cleanup completed successfully',
  })
  message?: string;
}

export class FileCleanupResponseDto extends BaseResponseDto<FileCleanupDataDto> {
  @ApiProperty({
    description: 'File cleanup operation result',
    type: FileCleanupDataDto,
  })
  declare data: FileCleanupDataDto;
}

// Storage usage by user data
export class UserStorageUsageDto {
  @ApiProperty({
    description: 'User ID',
    example: '507f1f77bcf86cd799439011',
  })
  userId: string;

  @ApiProperty({
    description: 'User email',
    example: 'user@example.com',
  })
  email: string;

  @ApiProperty({
    description: 'Total storage used by user in bytes',
    example: 52428800,
  })
  totalSize: number;

  @ApiProperty({
    description: 'Number of files owned by user',
    example: 15,
  })
  fileCount: number;
}

export class StorageUsageByUserDataDto {
  @ApiProperty({
    description: 'Array of user storage usage data',
    type: [UserStorageUsageDto],
  })
  users: UserStorageUsageDto[];

  @ApiProperty({
    description: 'Total number of users',
    example: 150,
  })
  total: number;

  @ApiProperty({
    description: 'Current page number',
    example: 1,
  })
  page: number;

  @ApiProperty({
    description: 'Total number of pages',
    example: 8,
  })
  totalPages: number;

  @ApiProperty({
    description: 'Optional message',
    example: 'Storage usage by user retrieved successfully',
  })
  message?: string;
}

export class StorageUsageByUserResponseDto extends BaseResponseDto<StorageUsageByUserDataDto> {
  @ApiProperty({
    description: 'Storage usage by user data',
    type: StorageUsageByUserDataDto,
  })
  declare data: StorageUsageByUserDataDto;
}
