import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  Post,
  Res,
  UploadedFile,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOkResponse,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Response } from 'express';

import { BaseController } from '../../common/controllers/base.controller';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ProtectedEndpoint, PublicEndpoint } from '../../common/decorators/api-endpoint.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import * as userSchema from '../../database/schemas/user.schema';

import { DeleteFileResultDto, DeleteFileResponseDto } from './dto/delete-file-response.dto';
import {
  PresignedUploadUrlResultDto,
  PresignedUploadUrlResponseDto,
} from './dto/presigned-url-response.dto';
import { DeleteFileDto, PresignedUploadUrlDto, UploadFileDto } from './dto/upload-file-request.dto';
import {
  FileUploadResultDto,
  FileUploadResponseDto,
  MultipleFileUploadResultDto,
  MultipleFileUploadResponseDto,
} from './dto/upload-file-response.dto';
import {
  FileUploadInterceptorFactory,
  ProfileImageUploadInterceptor,
  PropertyImagesUploadInterceptor,
} from './interceptors/file-upload.interceptor';
import {
  ProfileImageValidationPipe,
  PropertyImageValidationPipe,
} from './pipes/file-validation.pipe';
import { FileCategory, S3Service } from './services/s3.service';

@Controller('api/storage')
@ApiTags('Storage')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class StorageController extends BaseController {
  constructor(private readonly s3Service: S3Service) {
    super();
  }

  @Post('upload/profile-image')
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 uploads per minute
  @ProtectedEndpoint(
    'Upload profile image',
    'Upload a profile image file (JPEG, PNG, WebP, GIF)',
    FileUploadResponseDto,
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Profile image file',
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Profile image file (JPEG, PNG, WebP, GIF)',
        },
      },
      required: ['file'],
    },
  })
  @ApiOkResponse({
    description: 'Profile image uploaded successfully',
    type: FileUploadResponseDto,
  })
  @UseInterceptors(ProfileImageUploadInterceptor)
  async uploadProfileImage(
    @UploadedFile(ProfileImageValidationPipe) file: Express.Multer.File,
    @CurrentUser() user: userSchema.UserDocument,
  ): Promise<FileUploadResultDto> {
    return this.executeWithErrorHandling(
      async () => {
        const result = await this.s3Service.uploadFile(
          file.buffer,
          file.originalname,
          file.mimetype,
          FileCategory.PROFILE_IMAGES,
          String(user._id),
        );

        return {
          ...result,
          category: FileCategory.PROFILE_IMAGES,
        };
      },
      'Upload profile image',
      'Failed to upload profile image',
    );
  }

  @Post('upload/property-images')
  @Throttle({ default: { limit: 3, ttl: 60000 } }) // 3 batch uploads per minute
  @ProtectedEndpoint(
    'Upload property images',
    'Upload property images (up to 10 files) for listings',
    MultipleFileUploadResponseDto,
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Property image files (up to 10)',
    schema: {
      type: 'object',
      properties: {
        images: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
          description: 'Property image files (JPEG, PNG, WebP)',
        },
      },
      required: ['images'],
    },
  })
  @ApiOkResponse({
    description: 'Property images uploaded successfully',
    type: MultipleFileUploadResponseDto,
  })
  @UseInterceptors(PropertyImagesUploadInterceptor)
  async uploadPropertyImages(
    @UploadedFiles(PropertyImageValidationPipe) files: Express.Multer.File[],
    @CurrentUser() user: userSchema.UserDocument,
  ): Promise<MultipleFileUploadResultDto> {
    return this.executeWithErrorHandling(
      async () => {
        if (!files || files.length === 0) {
          throw new BadRequestException('At least one file is required');
        }

        const uploadPromises = files.map((file) =>
          this.s3Service.uploadFile(
            file.buffer,
            file.originalname,
            file.mimetype,
            FileCategory.PROPERTY_IMAGES,
            String(user._id),
          ),
        );

        const results = await Promise.all(uploadPromises);

        const uploadResults = results.map((result) => ({
          ...result,
          category: FileCategory.PROPERTY_IMAGES,
        }));

        return {
          files: uploadResults,
          count: uploadResults.length,
        };
      },
      'Upload property images',
      'Property images uploaded successfully',
    );
  }

  @Post('upload/general')
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 uploads per minute
  @ProtectedEndpoint(
    'Upload general file',
    'Upload any file with custom category and name options',
    FileUploadResponseDto,
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'File upload with metadata',
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'File to upload',
        },
        category: {
          type: 'string',
          enum: ['profile-images', 'property-images', 'documents', 'temp'],
          description: 'File category for organizing uploads',
        },
        customName: {
          type: 'string',
          maxLength: 100,
          description: 'Custom file name (optional)',
        },
      },
      required: ['file', 'category'],
    },
  })
  @ApiOkResponse({
    description: 'File uploaded successfully',
    type: FileUploadResponseDto,
  })
  @UseInterceptors(
    FileUploadInterceptorFactory.create('file', {
      category: FileCategory.DOCUMENTS,
    }),
  )
  async uploadGeneral(
    @UploadedFile() file: Express.Multer.File,
    @Body() uploadDto: UploadFileDto,
    @CurrentUser() user: userSchema.UserDocument,
  ): Promise<FileUploadResultDto> {
    return this.executeWithErrorHandling(
      async () => {
        if (!file) {
          throw new BadRequestException('File is required');
        }

        const fileName = uploadDto.customName
          ? `${uploadDto.customName}.${this.s3Service.getFileExtensionFromMimeType(file.mimetype)}`
          : file.originalname;

        const result = await this.s3Service.uploadFile(
          file.buffer,
          fileName,
          file.mimetype,
          uploadDto.category,
          String(user._id),
        );

        return {
          ...result,
          category: uploadDto.category,
        };
      },
      'Upload general file',
      'Failed to upload file',
    );
  }

  @Post('presigned-url')
  @Throttle({ default: { limit: 20, ttl: 60000 } }) // 20 presigned URLs per minute
  @ProtectedEndpoint(
    'Generate presigned URL',
    'Generate presigned URL for direct upload to S3',
    PresignedUploadUrlResponseDto,
  )
  async generatePresignedUploadUrl(
    @Body() dto: PresignedUploadUrlDto,
    @CurrentUser() user: userSchema.UserDocument,
  ): Promise<PresignedUploadUrlResultDto> {
    return this.executeWithErrorHandling(
      async () => {
        // Validate image types for image categories
        if ([FileCategory.PROFILE_IMAGES, FileCategory.PROPERTY_IMAGES].includes(dto.category)) {
          if (!this.s3Service.isValidImageType(dto.contentType)) {
            throw new BadRequestException('Invalid image content type');
          }
        }

        const result = await this.s3Service.generatePresignedUploadUrl(
          dto.fileName,
          dto.contentType,
          dto.category,
          String(user._id),
          {
            expiresIn: 300, // 5 minutes
            contentLength: dto.contentLength,
          },
        );

        return {
          ...result,
          expiresIn: 300,
        };
      },
      'Generate presigned upload URL',
      'Failed to generate presigned URL',
    );
  }

  @Delete('files/:key')
  @ProtectedEndpoint(
    'Delete file by key',
    'Delete a file using its URL-encoded file key',
    DeleteFileResponseDto,
  )
  @ApiParam({
    name: 'key',
    description: 'URL-encoded file key',
    example: 'folder%2Fsub%2Ffile.png',
  })
  async deleteFile(
    @Param('key') key: string,
    @CurrentUser() user: userSchema.UserDocument,
  ): Promise<DeleteFileResultDto> {
    return this.executeWithErrorHandling(
      async () => {
        if (!key) {
          throw new BadRequestException('File key is required');
        }

        // Enhanced authorization check for file deletion
        const userId = String(user._id);
        if (!this.isUserAuthorizedForFile(key, userId)) {
          throw new ForbiddenException('Not authorized to delete this file');
        }

        await this.s3Service.deleteFile(key);

        return {
          message: 'File deleted successfully',
          deletedKey: key,
        };
      },
      'Delete file',
      'Failed to delete file',
    );
  }

  @Get('files/:key')
  @Throttle({ default: { limit: 30, ttl: 60000 } }) // 30 requests per minute
  @ProtectedEndpoint(
    'Get file download URL',
    'Generate a download URL for accessing a file by its key',
    PresignedUploadUrlResponseDto,
  )
  @ApiParam({
    name: 'key',
    description: 'URL-encoded file key',
    example: 'folder%2Fsub%2Ffile.png',
  })
  async getFile(@Param('key') key: string, @CurrentUser() user: userSchema.UserDocument) {
    return this.executeWithErrorHandling(
      async () => {
        if (!key) {
          throw new BadRequestException('File key is required');
        }

        // Enhanced authorization check for file access
        const userId = String(user._id);
        if (!this.isUserAuthorizedForFile(key, userId)) {
          throw new ForbiddenException('Not authorized to access this file');
        }

        // Check if file exists
        const fileExists = await this.s3Service.fileExists(key, userId);
        if (!fileExists) {
          throw new BadRequestException('File not found');
        }

        // Generate presigned download URL
        const downloadUrl = await this.s3Service.generatePresignedDownloadUrl(key, 3600); // 1 hour expiry

        // Get file metadata if available
        const metadata = await this.s3Service.getFileMetadata(key);

        return {
          key,
          url: downloadUrl,
          expiresIn: 3600,
          contentType: metadata?.contentType || 'application/octet-stream',
        };
      },
      'Get file download URL',
      'Failed to get file download URL',
    );
  }

  @Post('delete')
  @ProtectedEndpoint(
    'Delete file by key or URL',
    'Delete a file using either its key or full URL',
    DeleteFileResponseDto,
  )
  async deleteFileByKeyOrUrl(
    @Body() dto: DeleteFileDto,
    @CurrentUser() user: userSchema.UserDocument,
  ): Promise<DeleteFileResultDto> {
    return this.executeWithErrorHandling(
      async () => {
        let key = dto.fileKey;

        // If it's a URL, extract the key
        if (key.startsWith('http')) {
          const extractedKey = this.s3Service.extractKeyFromUrl(key);
          if (!extractedKey) {
            throw new BadRequestException('Invalid file URL');
          }
          key = extractedKey;
        }

        // Enhanced authorization check for file deletion
        const userId = String(user._id);
        if (!this.isUserAuthorizedForFile(key, userId)) {
          throw new ForbiddenException('Not authorized to delete this file');
        }

        await this.s3Service.deleteFile(key);

        return {
          message: 'File deleted successfully',
          deletedKey: key,
        };
      },
      'Delete file',
      'Failed to delete file',
    );
  }

  @Get('public/files/:key')
  @Public()
  @Throttle({ default: { limit: 100, ttl: 60000 } }) // 100 requests per minute for public access
  @PublicEndpoint(
    'Serve public file',
    'Serve a file publicly by its key, redirecting to the actual file location',
  )
  @ApiParam({
    name: 'key',
    description: 'URL-encoded file key',
    example: 'property-images%2F123%2F2024-01-01%2Fimage.jpg',
  })
  async servePublicFile(@Param('key') key: string, @Res() res: Response) {
    if (!key) {
      throw new BadRequestException('File key is required');
    }

    try {
      // Decode the URL-encoded key
      const decodedKey = decodeURIComponent(key);

      // Generate the actual file URL from S3
      const fileUrl = await this.s3Service.generatePresignedDownloadUrl(decodedKey, 3600); // 1 hour expiry

      // Redirect to the actual file location
      res.redirect(302, fileUrl);
    } catch {
      throw new BadRequestException('File not found or inaccessible');
    }
  }

  /**
   * Enhanced authorization check for file operations
   */
  private isUserAuthorizedForFile(key: string, userId: string): boolean {
    if (!key || !userId) {
      return false;
    }

    // Sanitize userId to match the format used in file keys
    const sanitizedUserId = String(userId).replace(/[^a-zA-Z0-9_-]/g, '_');

    // Check if the file key contains the user's ID in the expected location
    // Expected format: category/userId/date/uuid-filename
    const keyParts = key.split('/');
    if (keyParts.length < 4) {
      return false;
    }

    // The userId should be in the second position of the key
    return keyParts[1] === sanitizedUserId;
  }
}
