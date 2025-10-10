import {
  BadRequestException,
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  Type,
  mixin,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FileFieldsInterceptor, FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import { Observable } from 'rxjs';

import { S3Config } from '../../../config/s3.config';
import { StorageInterceptorResult } from '../interfaces/storage.interfaces';
import { FileCategory } from '../services/s3.service';

export interface FileUploadOptions {
  category: FileCategory;
  maxFileSize?: number;
  allowedMimeTypes?: string[];
}

function getMaxSizeForCategory(s3Config: S3Config | undefined, category: FileCategory): number {
  if (!s3Config) {
    // Fallback to 10MB if config is missing; adjust if you prefer to throw
    return 10 * 1024 * 1024;
  }
  switch (category) {
    case FileCategory.PROFILE_IMAGES:
      return s3Config.maxProfileImageSize;
    case FileCategory.PROPERTY_IMAGES:
      return s3Config.maxPropertyImageSize;
    default:
      return s3Config.maxFileSize;
  }
}

function buildMulterOptions(
  s3Config: S3Config | undefined,
  options: FileUploadOptions,
  filesLimit: number,
): MulterOptions {
  const maxSize = options.maxFileSize ?? getMaxSizeForCategory(s3Config, options.category);

  return {
    limits: {
      fileSize: maxSize,
      files: filesLimit,
    },
    fileFilter: (_req, file, callback) => {
      if (options.allowedMimeTypes && !options.allowedMimeTypes.includes(file.mimetype)) {
        return callback(
          new BadRequestException(
            `Invalid file type. Allowed types: ${options.allowedMimeTypes.join(', ')}`,
          ),
          false,
        );
      }
      callback(null, true);
    },
  };
}

export class FileUploadInterceptorFactory {
  static create(fieldName: string, options: FileUploadOptions): Type<NestInterceptor> {
    @Injectable()
    class FileUploadInterceptor implements NestInterceptor {
      constructor(readonly configService: ConfigService) {}

      intercept(
        context: ExecutionContext,
        next: CallHandler,
      ): Observable<StorageInterceptorResult> | Promise<Observable<StorageInterceptorResult>> {
        const s3Config = this.configService.get<S3Config>('s3');
        const multerOptions = buildMulterOptions(s3Config, options, 1);

        const Inner = FileInterceptor(fieldName, multerOptions);
        const innerInstance = new Inner();

        return innerInstance.intercept(context, next);
      }
    }

    return mixin(FileUploadInterceptor);
  }

  static createMultiple(
    fieldName: string,
    maxCount: number,
    options: FileUploadOptions,
  ): Type<NestInterceptor> {
    @Injectable()
    class FilesUploadInterceptor implements NestInterceptor {
      constructor(readonly configService: ConfigService) {}

      intercept(
        context: ExecutionContext,
        next: CallHandler,
      ): Observable<StorageInterceptorResult> | Promise<Observable<StorageInterceptorResult>> {
        const s3Config = this.configService.get<S3Config>('s3');
        const multerOptions = buildMulterOptions(s3Config, options, maxCount);

        const Inner = FilesInterceptor(fieldName, maxCount, multerOptions);
        const innerInstance = new Inner();

        return innerInstance.intercept(context, next);
      }
    }

    return mixin(FilesUploadInterceptor);
  }

  static createFields(
    uploadFields: Array<{ name: string; maxCount: number }>,
    options: FileUploadOptions,
  ): Type<NestInterceptor> {
    @Injectable()
    class FileFieldsUploadInterceptor implements NestInterceptor {
      constructor(readonly configService: ConfigService) {}

      intercept(
        context: ExecutionContext,
        next: CallHandler,
      ): Observable<StorageInterceptorResult> | Promise<Observable<StorageInterceptorResult>> {
        const s3Config = this.configService.get<S3Config>('s3');
        const totalCount = uploadFields.reduce((sum, f) => sum + f.maxCount, 0);
        const multerOptions = buildMulterOptions(s3Config, options, totalCount);

        const Inner = FileFieldsInterceptor(uploadFields, multerOptions);
        const innerInstance = new Inner();

        return innerInstance.intercept(context, next);
      }
    }

    return mixin(FileFieldsUploadInterceptor);
  }
}

// Common interceptors for different file types
export const ProfileImageUploadInterceptor: Type<NestInterceptor> =
  FileUploadInterceptorFactory.create('file', {
    category: FileCategory.PROFILE_IMAGES,
    allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'],
  });

export const PropertyImagesUploadInterceptor: Type<NestInterceptor> =
  FileUploadInterceptorFactory.createMultiple('images', 10, {
    category: FileCategory.PROPERTY_IMAGES,
    allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'],
  });

export const DocumentUploadInterceptor: Type<NestInterceptor> = FileUploadInterceptorFactory.create(
  'document',
  {
    category: FileCategory.DOCUMENTS,
    allowedMimeTypes: ['application/pdf', 'image/jpeg', 'image/png'],
  },
);
