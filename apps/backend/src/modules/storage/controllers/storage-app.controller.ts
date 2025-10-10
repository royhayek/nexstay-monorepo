import { Controller, Post, Delete, Body, UseInterceptors, UploadedFile } from '@nestjs/common';
import { ApiTags, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { ProtectedEndpoint } from '../../../common/decorators/api-endpoint.decorator';
import { BaseController } from '../../../common/controllers/base.controller';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import type { UserDocument } from '../../../database/schemas/user.schema';
import { S3Service, FileCategory } from '../services/s3.service';
import { FileUploadInterceptorFactory } from '../interceptors/file-upload.interceptor';
import { FileUploadResponseDto } from '../dto/upload-file-response.dto';
import { DeleteFileResponseDto } from '../dto/delete-file-response.dto';
import { PresignedUploadUrlResponseDto } from '../dto/presigned-url-response.dto';
import type {
  CategoryRequest,
  FileDeleteRequest,
  FilePresignedUrlRequest,
} from '../interfaces/storage.interfaces';

/**
 * App Controller for Storage
 * Handles file storage operations for mobile app and website users
 */
@Controller('app/storage')
@ApiTags('Storage')
export class StorageAppController extends BaseController {
  constructor(private readonly s3Service: S3Service) {
    super();
  }

  @Post('upload')
  @UseInterceptors(
    FileUploadInterceptorFactory.create('file', { category: FileCategory.PROPERTY_IMAGES }),
  )
  @ProtectedEndpoint(
    'Upload a file',
    'Upload files such as images and documents with automatic processing and validation',
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
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
          enum: ['PROFILE_IMAGES', 'PROPERTY_IMAGES', 'DOCUMENTS', 'TEMP'],
          description: 'File category',
        },
      },
      required: ['file', 'category'],
    },
  })
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: CategoryRequest,
    @CurrentUser() user: UserDocument,
  ): Promise<FileUploadResponseDto> {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        const result = await this.s3Service.uploadFile(
          file.buffer,
          file.originalname,
          file.mimetype,
          body.category,
          String(user._id),
        );

        return {
          url: result.url,
          key: result.key,
          size: result.size,
          bucket: result.bucket,
          contentType: result.contentType || file.mimetype,
          category: body.category,
          isProcessed: result.isProcessed,
          variants: result.variants,
        };
      },
      'Upload file',
      'File Upload Successful',
      'File uploaded successfully',
      'Failed to upload file',
    );
  }

  @Delete('file')
  @ProtectedEndpoint('Delete a file', 'Delete previously uploaded files by providing the file URL')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          description: 'File URL to delete',
        },
      },
      required: ['url'],
    },
  })
  async deleteFile(@Body() body: FileDeleteRequest): Promise<DeleteFileResponseDto> {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        await this.s3Service.deleteFile(body.url);
        return {
          message: 'File deleted successfully',
          deletedKey: body.url,
        };
      },
      'Delete file',
      'File Deletion Successful',
      'File deleted successfully',
      'Failed to delete file',
    );
  }

  @Post('presigned-url')
  @ProtectedEndpoint(
    'Get presigned URL for direct upload',
    'Generate secure presigned URLs for direct client-to-S3 file uploads',
  )
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        fileName: {
          type: 'string',
          description: 'File name',
        },
        fileType: {
          type: 'string',
          description: 'File MIME type',
        },
        category: {
          type: 'string',
          enum: ['PROFILE_IMAGES', 'PROPERTY_IMAGES', 'DOCUMENTS', 'TEMP'],
          description: 'File category',
        },
      },
      required: ['fileName', 'fileType', 'category'],
    },
  })
  async getPresignedUrl(
    @Body() body: FilePresignedUrlRequest,
    @CurrentUser() user: UserDocument,
  ): Promise<PresignedUploadUrlResponseDto> {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        const result = await this.s3Service.generatePresignedUploadUrl(
          body.fileName,
          body.fileType,
          body.category as FileCategory,
          String(user._id),
        );

        return {
          uploadUrl: result.uploadUrl,
          key: result.key,
          expiresIn: 300, // 5 minutes default expiration
        };
      },
      'Generate presigned URL',
      'Presigned URL Generated',
      'Presigned URL generated successfully',
      'Failed to generate presigned URL',
    );
  }
}
