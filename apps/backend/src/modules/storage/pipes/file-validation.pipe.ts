import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { S3Config } from '../../../config/s3.config';
import { FileCategory } from '../services/s3.service';
import { FileUtils } from '../../../common/utils/file.utils';
import { LoggingUtil } from '../../../common/utils/logging.util';

export interface FileValidationOptions {
  category: FileCategory;
  allowedMimeTypes?: string[];
  maxSize?: number;
  required?: boolean;
}

@Injectable()
export class FileValidationPipe implements PipeTransform {
  constructor(
    private readonly configService: ConfigService,
    private readonly options: FileValidationOptions,
  ) {}

  transform(
    file: Express.Multer.File | Express.Multer.File[] | undefined,
  ): Express.Multer.File | Express.Multer.File[] | undefined {
    // Handle array of files
    if (Array.isArray(file)) {
      return file
        .map((f) => this.validateSingleFile(f))
        .filter((f): f is Express.Multer.File => f !== undefined);
    }

    // Handle single file
    return this.validateSingleFile(file);
  }

  private validateSingleFile(
    file: Express.Multer.File | undefined,
  ): Express.Multer.File | undefined {
    const s3Config = this.configService.get<S3Config>('s3')!;

    // Check if file is required
    if (this.options.required && !file) {
      throw new BadRequestException('File is required');
    }

    if (!file) {
      return file;
    }

    // Validate file size
    const maxSize =
      this.options.maxSize || this.getMaxSizeForCategory(s3Config, this.options.category);
    if (file.size > maxSize) {
      throw new BadRequestException(
        `File size ${file.size} bytes exceeds maximum allowed size of ${maxSize} bytes`,
      );
    }

    // Skip MIME type validation since interceptor handles it
    // The interceptor has access to the original file metadata
    // while here the file.mimetype might be undefined due to processing

    // Validate file buffer
    if (!file.buffer || file.buffer.length === 0) {
      throw new BadRequestException('File buffer is empty');
    }

    // Enhanced security validations using FileUtils (synchronous validation)
    this.validateFileWithUtilsSync(file);

    return file;
  }

  private validateFileWithUtilsSync(file: Express.Multer.File): void {
    // Generate safe filename first
    const safeFilename = FileUtils.generateSafeFilename(
      file.originalname.replace(/\.[^/.]+$/, ''), // Remove extension
      '.' + (file.originalname.split('.').pop() || ''),
    );

    // Update filename if it was changed
    if (safeFilename !== file.originalname) {
      LoggingUtil.debug(
        `Filename sanitized: ${file.originalname} -> ${safeFilename}`,
        'FileValidationPipe',
      );
      file.originalname = safeFilename;
    }

    // Use FileUtils for synchronous validation (async validation would require changing pipe interface)
    // For now, we'll use the enhanced filename sanitization and basic validation
    // Full FileUtils.validateFile can be used in controllers where async is possible

    const allowedMimeTypes = this.options.allowedMimeTypes || this.getDefaultMimeTypesForCategory();

    // Basic MIME type validation
    if (file.mimetype && !allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(`File type ${file.mimetype} is not allowed`);
    }

    // Check for dangerous extensions using FileUtils approach
    const extension = file.originalname.split('.').pop()?.toLowerCase();
    const dangerousExtensions = [
      'exe',
      'bat',
      'cmd',
      'com',
      'pif',
      'scr',
      'vbs',
      'js',
      'jar',
      'app',
      'deb',
      'pkg',
      'dmg',
      'sh',
      'csh',
      'pl',
      'php',
      'asp',
      'aspx',
    ];

    if (extension && dangerousExtensions.includes(extension)) {
      throw new BadRequestException(`Potentially dangerous file extension: .${extension}`);
    }

    // Basic content validation for suspicious patterns
    const fileString = file.buffer.toString('utf8', 0, Math.min(1024, file.buffer.length));
    const suspiciousPatterns = [
      /<script[^>]*>/i,
      /javascript:/i,
      /vbscript:/i,
      /data:text\/html/i,
      /<iframe[^>]*>/i,
      /<\?php/i,
      /eval\s*\(/i,
    ];

    for (const pattern of suspiciousPatterns) {
      if (pattern.test(fileString)) {
        throw new BadRequestException('File contains potentially malicious content');
      }
    }
  }

  private getDefaultMimeTypesForCategory(): string[] {
    switch (this.options.category) {
      case FileCategory.PROFILE_IMAGES:
      case FileCategory.PROPERTY_IMAGES:
        return ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
      case FileCategory.DOCUMENTS:
        return ['application/pdf', 'text/plain', 'text/csv', 'application/json'];
      default:
        return [
          'image/jpeg',
          'image/png',
          'image/webp',
          'image/gif',
          'application/pdf',
          'text/plain',
        ];
    }
  }

  private getMaxSizeForCategory(s3Config: S3Config, category: FileCategory): number {
    switch (category) {
      case FileCategory.PROFILE_IMAGES:
        return s3Config.maxProfileImageSize;
      case FileCategory.PROPERTY_IMAGES:
        return s3Config.maxPropertyImageSize;
      default:
        return s3Config.maxFileSize;
    }
  }
}

@Injectable()
export class ImageValidationPipe extends FileValidationPipe {
  constructor(configService: ConfigService, category: FileCategory) {
    super(configService, {
      category,
      allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'],
      required: true,
    });
  }
}

@Injectable()
export class ProfileImageValidationPipe extends ImageValidationPipe {
  constructor(configService: ConfigService) {
    super(configService, FileCategory.PROFILE_IMAGES);
  }
}

@Injectable()
export class PropertyImageValidationPipe extends ImageValidationPipe {
  constructor(configService: ConfigService) {
    super(configService, FileCategory.PROPERTY_IMAGES);
  }
}

@Injectable()
export class OptionalImageValidationPipe extends FileValidationPipe {
  constructor(configService: ConfigService, category: FileCategory) {
    super(configService, {
      category,
      allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'],
      required: false,
    });
  }
}

@Injectable()
export class OptionalProfileImageValidationPipe extends OptionalImageValidationPipe {
  constructor(configService: ConfigService) {
    super(configService, FileCategory.PROFILE_IMAGES);
  }
}
