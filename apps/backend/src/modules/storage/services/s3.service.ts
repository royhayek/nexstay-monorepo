import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';
import { Readable } from 'stream';

import { S3Config } from '../../../config/s3.config';
import { StorageError, ImageVariantMetadata } from '../interfaces/storage.interfaces';
import { ImageProcessingService, ImageSize, ProcessedImage } from './image-processing.service';
import { LoggingUtil } from '../../../common/utils/logging.util';
import { DateUtils } from '../../../common/utils/date.utils';
import { NetworkUtil } from '../../../common/utils/network.util';

export interface UploadResult {
  key: string;
  url: string;
  bucket: string;
  size: number;
  contentType: string;
  etag?: string;
}

export interface ImageUploadResult extends UploadResult {
  variants?: ImageVariantMetadata[];
  isProcessed: boolean;
}

// ImageVariantResult is now replaced by ImageVariantMetadata from shared interfaces

export interface PresignedUrlOptions {
  expiresIn?: number; // seconds
  contentType?: string;
  contentLength?: number;
}

export interface FileMetadata {
  key: string;
  size: number;
  lastModified: Date;
  etag: string;
  contentType: string;
}

export enum FileCategory {
  PROFILE_IMAGES = 'profile-images',
  PROPERTY_IMAGES = 'property-images',
  DOCUMENTS = 'documents',
  TEMP = 'temp',
}

@Injectable()
export class S3Service {
  private readonly s3Client: S3Client;
  private readonly s3Config: S3Config;

  constructor(
    private readonly configService: ConfigService,
    private readonly imageProcessingService?: ImageProcessingService,
  ) {
    this.s3Config = this.configService.get<S3Config>('s3')!;

    if (!this.s3Config.bucketName) {
      throw new Error(
        'AWS S3 bucket name is required. Please set AWS_S3_BUCKET_NAME environment variable.',
      );
    }

    const s3ClientConfig: {
      region: string;
      credentials?: {
        accessKeyId: string;
        secretAccessKey: string;
      };
      endpoint?: string;
      forcePathStyle?: boolean;
    } = {
      region: this.s3Config.region,
    };

    // Only set credentials if they are provided
    if (this.s3Config.accessKeyId && this.s3Config.secretAccessKey) {
      s3ClientConfig.credentials = {
        accessKeyId: this.s3Config.accessKeyId,
        secretAccessKey: this.s3Config.secretAccessKey,
      };
    }

    // Only set endpoint and forcePathStyle if endpoint is provided (for LocalStack or custom endpoints)
    if (this.s3Config.endpoint) {
      s3ClientConfig.endpoint = this.s3Config.endpoint;
      s3ClientConfig.forcePathStyle = this.s3Config.forcePathStyle;
    }

    this.s3Client = new S3Client(s3ClientConfig);

    LoggingUtil.log(
      `S3Service initialized with bucket: ${this.s3Config.bucketName}, region: ${this.s3Config.region}`,
    );
  }

  /**
   * Upload a file buffer to S3 with optional image processing
   */
  async uploadFile(
    buffer: Buffer,
    fileName: string,
    contentType: string,
    category: FileCategory,
    userId?: string,
    processImages = true,
  ): Promise<ImageUploadResult> {
    try {
      // Validate file size based on category
      this.validateFileSize(buffer.length, category);

      // Generate unique key
      const key = this.generateFileKey(fileName, category, userId);

      const command = new PutObjectCommand({
        Bucket: this.s3Config.bucketName,
        Key: key,
        Body: buffer,
        ContentType: contentType,
      });

      const result = await this.s3Client.send(command);

      let uploadResult: ImageUploadResult;

      // Check if image processing is enabled and supported
      const shouldProcessImage =
        processImages &&
        this.s3Config.enableImageProcessing &&
        this.imageProcessingService &&
        this.shouldProcessImage(contentType, category);

      if (shouldProcessImage) {
        uploadResult = await this.uploadWithImageProcessing(
          buffer,
          fileName,
          contentType,
          category,
          userId,
        );
      } else {
        // Upload original file without processing
        uploadResult = {
          key,
          url: this.getPublicUrl(key),
          bucket: this.s3Config.bucketName,
          size: buffer.length,
          contentType,
          etag: result.ETag,
          isProcessed: false,
        };
      }

      LoggingUtil.log(
        `File uploaded successfully: ${key}, size: ${buffer.length} bytes, processed: ${uploadResult.isProcessed}`,
      );
      return uploadResult;
    } catch (error) {
      LoggingUtil.error(
        `Failed to upload file: ${fileName}`,
        error instanceof Error ? error.stack : String(error),
      );

      // Check if it's an AWS credential or configuration error
      if (error instanceof Error) {
        if (error.message.includes('credentials') || error.message.includes('AccessDenied')) {
          throw new InternalServerErrorException('AWS credentials not configured properly');
        }
        if (error.message.includes('NoSuchBucket')) {
          throw new InternalServerErrorException(
            `S3 bucket ${this.s3Config.bucketName} does not exist`,
          );
        }
      }

      throw new InternalServerErrorException('Failed to upload file');
    }
  }

  /**
   * Delete a file from S3
   */
  async deleteFile(key: string): Promise<void> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.s3Config.bucketName,
        Key: key,
      });

      await this.s3Client.send(command);
      LoggingUtil.log(`File deleted successfully: ${key}`);
    } catch (error) {
      LoggingUtil.error(
        `Failed to delete file: ${key}`,
        error instanceof Error ? error.stack : String(error),
      );
      throw new InternalServerErrorException('Failed to delete file');
    }
  }

  /**
   * Delete multiple files from S3
   */
  async deleteFiles(keys: string[]): Promise<void> {
    try {
      const deletePromises = keys.map((key) => this.deleteFile(key));
      await Promise.all(deletePromises);
      LoggingUtil.log(`${keys.length} files deleted successfully`);
    } catch (error) {
      LoggingUtil.error(
        `Failed to delete multiple files`,
        error instanceof Error ? error.stack : String(error),
      );
      throw new InternalServerErrorException('Failed to delete files');
    }
  }

  /**
   * Delete an image and all its variants by finding all related files using the exact key structure
   */
  async deleteImageWithVariants(originalKey: string): Promise<void> {
    try {
      // Find all related files for this image (original + all variants)
      const allRelatedKeys = await this.findAllVariantsByKey(originalKey);

      // Delete all related files
      if (allRelatedKeys.length > 0) {
        await this.deleteFiles(allRelatedKeys);
        LoggingUtil.log(
          `Image and all variants deleted: ${originalKey} (${allRelatedKeys.length} files deleted)`,
        );
      } else {
        LoggingUtil.warn(`No related files found for: ${originalKey}`);
        // Still try to delete the original key as fallback
        await this.deleteFile(originalKey);
      }
    } catch (error) {
      LoggingUtil.error(
        `Failed to delete image with variants: ${originalKey}`,
        error instanceof Error ? error.stack : String(error),
      );
      throw new InternalServerErrorException('Failed to delete image and variants');
    }
  }

  /**
   * Find all variants and the original image for a given image key (including siblings)
   */
  private async findAllVariantsByKey(originalKey: string): Promise<string[]> {
    try {
      // Parse the original key to extract components
      const keyInfo = this.parseImageKey(originalKey);
      if (!keyInfo) {
        LoggingUtil.warn(`Could not parse key: ${originalKey}`);
        return [];
      }

      // Get directory prefix for this image
      const directoryPrefix = `${keyInfo.category}/${keyInfo.userId}/${keyInfo.timestamp}/`;

      // Use S3 ListObjects to find all files in this directory
      const listParams = {
        Bucket: this.s3Config.bucketName,
        Prefix: directoryPrefix,
      };

      const response = await this.s3Client.send(new ListObjectsV2Command(listParams));
      const matchingKeys: string[] = [];

      if (response.Contents) {
        for (const object of response.Contents) {
          if (!object.Key) continue;

          // Parse each found key
          const foundKeyInfo = this.parseImageKey(object.Key);
          if (!foundKeyInfo) continue;

          // Check if this file belongs to the same base image
          // Match criteria: same baseFilename (without variant suffix)
          // This will find ALL files related to this image: original + all variants
          if (foundKeyInfo.baseFilename === keyInfo.baseFilename) {
            matchingKeys.push(object.Key);
          }
        }
      }

      LoggingUtil.log(`Found ${matchingKeys.length} related files for key: ${originalKey}`);

      return matchingKeys;
    } catch (error) {
      LoggingUtil.errorWithException(`Failed to find variants for key: ${originalKey}`, error);
      return [];
    }
  }

  /**
   * Parse an image key to extract its components
   */
  private parseImageKey(key: string): {
    category: string;
    userId: string;
    timestamp: string;
    uuid: string;
    baseFilename: string;
    variantSuffix: string;
    extension: string;
  } | null {
    try {
      // Expected format: "property-images/userId/2025-08-30/uuid-filename_variant.ext"
      const parts = key.split('/');
      if (parts.length !== 4) return null;

      const [category, userId, timestamp, filename] = parts;

      // Parse filename: "uuid-baseFilename_variant.ext" or "uuid-baseFilename.ext"
      const filenameMatch = filename.match(/^([a-f0-9-]{36})-(.+)\.(.+)$/i);
      if (!filenameMatch) return null;

      const [, uuid, fullFilename, extension] = filenameMatch;

      // Extract base filename and variant suffix
      const variantMatch = fullFilename.match(/^(.+?)(_thumbnail|_medium|_large)$/);
      let baseFilename: string;
      let variantSuffix: string;

      if (variantMatch) {
        // Has variant suffix
        baseFilename = variantMatch[1];
        variantSuffix = variantMatch[2];
      } else {
        // No variant suffix (original file)
        baseFilename = fullFilename;
        variantSuffix = '';
      }

      return {
        category,
        userId,
        timestamp,
        uuid,
        baseFilename,
        variantSuffix,
        extension,
      };
    } catch (error) {
      LoggingUtil.errorWithException(`Failed to parse key: ${key}`, error);
      return null;
    }
  }

  /**
   * Check if a file exists in S3 with permission validation
   */
  async fileExists(key: string, userId?: string): Promise<boolean> {
    try {
      // Validate key format for security
      if (!this.validateExtractedKey(key)) {
        return false;
      }

      // If userId provided, validate ownership
      if (userId && !key.includes(String(userId).replace(/[^a-zA-Z0-9_-]/g, '_'))) {
        LoggingUtil.warn(`User ${userId} attempted to access unauthorized file: ${key}`);
        return false;
      }

      const command = new HeadObjectCommand({
        Bucket: this.s3Config.bucketName,
        Key: key,
      });

      await this.s3Client.send(command);
      return true;
    } catch (error) {
      if (error instanceof Error && !error.message.includes('NotFound')) {
        LoggingUtil.error(`Error checking file existence: ${key}`, error.stack);
      }
      return false;
    }
  }

  /**
   * Get file metadata
   */
  async getFileMetadata(key: string): Promise<FileMetadata | null> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.s3Config.bucketName,
        Key: key,
      });

      const result = await this.s3Client.send(command);

      return {
        key,
        size: result.ContentLength || 0,
        lastModified: result.LastModified || DateUtils.now(),
        etag: result.ETag || '',
        contentType: result.ContentType || 'application/octet-stream',
      };
    } catch (error) {
      LoggingUtil.error(
        `Failed to get file metadata: ${key}`,
        error instanceof Error ? error.stack : String(error),
      );
      return null;
    }
  }

  /**
   * Generate a presigned URL for direct upload
   */
  async generatePresignedUploadUrl(
    fileName: string,
    contentType: string,
    category: FileCategory,
    userId?: string,
    options: PresignedUrlOptions = {},
  ): Promise<{ uploadUrl: string; key: string; fields?: Record<string, string> }> {
    try {
      const key = this.generateFileKey(fileName, category, userId);
      const expiresIn = options.expiresIn || 300; // 5 minutes default

      const command = new PutObjectCommand({
        Bucket: this.s3Config.bucketName,
        Key: key,
        ContentType: contentType,
        ...(options.contentLength && { ContentLength: options.contentLength }),
      });

      const uploadUrl = await getSignedUrl(this.s3Client, command, { expiresIn });

      return {
        uploadUrl,
        key,
      };
    } catch (error) {
      LoggingUtil.error(
        `Failed to generate presigned upload URL for: ${fileName}`,
        error instanceof Error ? error.stack : String(error),
      );
      throw new InternalServerErrorException('Failed to generate upload URL');
    }
  }

  /**
   * Generate a presigned URL for download
   */
  async generatePresignedDownloadUrl(key: string, expiresIn: number = 3600): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.s3Config.bucketName,
        Key: key,
      });

      return await getSignedUrl(this.s3Client, command, { expiresIn });
    } catch (error) {
      LoggingUtil.error(
        `Failed to generate presigned download URL for: ${key}`,
        error instanceof Error ? error.stack : String(error),
      );
      throw new InternalServerErrorException('Failed to generate download URL');
    }
  }

  /**
   * Get file object as stream
   */
  async getObjectStream(key: string): Promise<Readable> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.s3Config.bucketName,
        Key: key,
      });

      const response = await this.s3Client.send(command);

      if (!response.Body) {
        throw new NotFoundException('File not found or empty');
      }

      // AWS SDK v3 returns a Readable stream
      return response.Body as Readable;
    } catch (error) {
      LoggingUtil.error(
        `Failed to get object stream for: ${key}`,
        error instanceof Error ? error.stack : String(error),
      );

      if (error instanceof NotFoundException) {
        throw error;
      }

      throw new InternalServerErrorException('Failed to get file stream');
    }
  }

  /**
   * List files in a specific category/prefix
   */
  async listFiles(prefix: string, maxKeys: number = 100): Promise<FileMetadata[]> {
    try {
      const command = new ListObjectsV2Command({
        Bucket: this.s3Config.bucketName,
        Prefix: prefix,
        MaxKeys: maxKeys,
      });

      const result = await this.s3Client.send(command);

      return (result.Contents || []).map((obj) => ({
        key: obj.Key!,
        size: obj.Size || 0,
        lastModified: obj.LastModified || DateUtils.now(),
        etag: obj.ETag || '',
        contentType: 'application/octet-stream', // ListObjects doesn't return content type, using default
      }));
    } catch (error) {
      LoggingUtil.error(
        `Failed to list files with prefix: ${prefix}`,
        error instanceof Error ? error.stack : String(error),
      );
      throw new InternalServerErrorException('Failed to list files');
    }
  }

  /**
   * Get public URL for a file (if bucket allows public access)
   */
  getPublicUrl(key: string): string {
    let url: string;

    // Prioritize custom endpoints (LocalStack, MinIO, etc.) over file serve proxy
    if (this.s3Config.endpoint) {
      // For custom endpoints like LocalStack - return direct S3-compatible URL
      url = `${this.s3Config.endpoint}/${this.s3Config.bucketName}/${key}`;

      // Replace localhost with actual server IP for mobile device access
      if (NetworkUtil.isLocalhostUrl(url)) {
        url = NetworkUtil.replaceLocalhostWithIp(url);
        LoggingUtil.log(`Replaced localhost in URL: ${url}`);
      }

      return url;
    }

    // If a file serve base URL is configured, use it (for development/mobile apps)
    // This is only used when there's no custom endpoint
    if (this.s3Config.fileServeBaseUrl) {
      url = `${this.s3Config.fileServeBaseUrl}/files/${encodeURIComponent(key)}`;

      // Replace localhost with actual server IP for mobile device access
      if (NetworkUtil.isLocalhostUrl(url)) {
        url = NetworkUtil.replaceLocalhostWithIp(url);
      }

      return url;
    }

    // Default to AWS S3 URL format
    return `https://${this.s3Config.bucketName}.s3.${this.s3Config.region}.amazonaws.com/${key}`;
  }

  /**
   * Extract key from URL with enhanced security validation
   */
  extractKeyFromUrl(url: string): string | null {
    try {
      // Validate URL format and prevent malicious URLs
      if (!url || typeof url !== 'string') {
        return null;
      }

      // Check for suspicious URL patterns
      const suspiciousPatterns = [/javascript:/i, /data:/i, /vbscript:/i, /file:/i, /ftp:/i];

      if (suspiciousPatterns.some((pattern) => pattern.test(url))) {
        LoggingUtil.warn(`Suspicious URL detected: ${url.substring(0, 100)}`);
        return null;
      }

      const urlObj = new URL(url);

      // Validate hostname to prevent SSRF attacks
      const allowedHosts = [
        `${this.s3Config.bucketName}.s3.${this.s3Config.region}.amazonaws.com`,
        `s3.${this.s3Config.region}.amazonaws.com`,
      ];

      // Add custom endpoint if configured (for LocalStack testing)
      if (this.s3Config.endpoint) {
        const endpointUrl = new URL(this.s3Config.endpoint);
        allowedHosts.push(endpointUrl.hostname);
      }

      if (!allowedHosts.includes(urlObj.hostname)) {
        LoggingUtil.warn(`Invalid hostname for S3 URL: ${urlObj.hostname}`);
        return null;
      }

      const pathname = urlObj.pathname;

      // Handle different URL formats
      if (pathname.startsWith(`/${this.s3Config.bucketName}/`)) {
        const key = pathname.substring(`/${this.s3Config.bucketName}/`.length);
        return this.validateExtractedKey(key);
      }

      // For bucket.s3.region.amazonaws.com format
      if (urlObj.hostname.startsWith(`${this.s3Config.bucketName}.s3.`)) {
        const key = pathname.substring(1); // Remove leading slash
        return this.validateExtractedKey(key);
      }

      return null;
    } catch (error) {
      LoggingUtil.warn(
        `Failed to extract key from URL: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      return null;
    }
  }

  /**
   * Validate extracted S3 key for security
   */
  private validateExtractedKey(key: string): string | null {
    if (!key || typeof key !== 'string') {
      return null;
    }

    // Check for path traversal attempts
    if (key.includes('..') || key.includes('//') || key.startsWith('/')) {
      LoggingUtil.warn(`Invalid key pattern detected: ${key}`);
      return null;
    }

    // Validate key format matches our expected pattern
    const keyPattern = /^[a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+\/\d{4}-\d{2}-\d{2}\/[a-f0-9-]+-.+$/;
    if (!keyPattern.test(key)) {
      LoggingUtil.warn(`Key does not match expected pattern: ${key}`);
      return null;
    }

    return key;
  }

  /**
   * Generate a unique file key with enhanced sanitization
   */
  private generateFileKey(fileName: string, category: FileCategory, userId?: string): string {
    const timestamp = DateUtils.now().toISOString().split('T')[0]; // YYYY-MM-DD
    const uuid = uuidv4();

    // Enhanced filename sanitization
    let sanitizedFileName = fileName
      .replace(/\.\.+/g, '.') // Remove multiple dots
      .replace(/[^a-zA-Z0-9._-]/g, '_') // Allow only safe characters
      .replace(/^[._-]+|[._-]+$/g, '') // Remove leading/trailing special chars
      .substring(0, 100); // Limit length

    // Ensure file has an extension
    if (!sanitizedFileName.includes('.')) {
      sanitizedFileName += '.bin';
    }

    // Ensure filename is not empty after sanitization
    if (!sanitizedFileName || sanitizedFileName === '.bin') {
      sanitizedFileName = `file_${Date.now()}.bin`;
    }

    if (userId) {
      // Sanitize userId to prevent path injection
      const sanitizedUserId = String(userId).replace(/[^a-zA-Z0-9_-]/g, '_');
      return `${category}/${sanitizedUserId}/${timestamp}/${uuid}-${sanitizedFileName}`;
    }

    return `${category}/${timestamp}/${uuid}-${sanitizedFileName}`;
  }

  /**
   * Generate file key with provided UUID (for consistent variant naming)
   */
  private generateFileKeyWithUuid(
    fileName: string,
    category: FileCategory,
    userId: string | undefined,
    uuid: string,
  ): string {
    const timestamp = DateUtils.now().toISOString().split('T')[0]; // YYYY-MM-DD

    // Enhanced filename sanitization (same as generateFileKey)
    let sanitizedFileName = fileName
      .replace(/\.\.+/g, '.') // Remove multiple dots
      .replace(/[^a-zA-Z0-9._-]/g, '_') // Allow only safe characters
      .replace(/^[._-]+|[._-]+$/g, '') // Remove leading/trailing special chars
      .substring(0, 100); // Limit length

    // Ensure file has an extension
    if (!sanitizedFileName.includes('.')) {
      sanitizedFileName += '.bin';
    }

    // Ensure filename is not empty after sanitization
    if (!sanitizedFileName || sanitizedFileName === '.bin') {
      sanitizedFileName = `file_${Date.now()}.bin`;
    }

    if (userId) {
      // Sanitize userId to prevent path injection
      const sanitizedUserId = String(userId).replace(/[^a-zA-Z0-9_-]/g, '_');
      return `${category}/${sanitizedUserId}/${timestamp}/${uuid}-${sanitizedFileName}`;
    }

    return `${category}/${timestamp}/${uuid}-${sanitizedFileName}`;
  }

  /**
   * Validate file size based on category
   */
  private validateFileSize(size: number, category: FileCategory): void {
    let maxSize: number;

    switch (category) {
      case FileCategory.PROFILE_IMAGES:
        maxSize = this.s3Config.maxProfileImageSize;
        break;
      case FileCategory.PROPERTY_IMAGES:
        maxSize = this.s3Config.maxPropertyImageSize;
        break;
      default:
        maxSize = this.s3Config.maxFileSize;
    }

    if (size > maxSize) {
      throw new BadRequestException(
        `File size ${size} bytes exceeds maximum allowed size of ${maxSize} bytes for category ${category}`,
      );
    }
  }

  /**
   * Validate content type
   */
  isValidImageType(contentType: string): boolean {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    return allowedTypes.includes(contentType.toLowerCase());
  }

  /**
   * Get file extension from content type
   */
  getFileExtensionFromMimeType(contentType: string): string {
    const mimeToExt: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp',
      'image/gif': 'gif',
      'application/pdf': 'pdf',
      'text/plain': 'txt',
    };

    return mimeToExt[contentType.toLowerCase()] || 'bin';
  }

  /**
   * Upload file with image processing for multiple variants
   */
  private async uploadWithImageProcessing(
    buffer: Buffer,
    fileName: string,
    contentType: string,
    category: FileCategory,
    userId?: string,
  ): Promise<ImageUploadResult> {
    try {
      // Process images based on category
      let processedImages: ProcessedImage[];

      if (category === FileCategory.PROFILE_IMAGES) {
        processedImages = await this.imageProcessingService!.processProfileImage(buffer, fileName);
      } else {
        processedImages = await this.imageProcessingService!.processPropertyImage(buffer, fileName);
      }

      // Generate a shared UUID for all variants of this image
      const sharedUuid = uuidv4();

      // Upload all variants
      const uploadPromises = processedImages.map(async (processedImage) => {
        const variantFileName = this.imageProcessingService!.getProcessedFileName(
          fileName,
          {
            suffix: `_${processedImage.size}`,
            quality: 90,
            format: processedImage.format as 'webp' | 'jpeg' | 'png',
          },
          processedImage.format,
        );

        const variantKey = this.generateFileKeyWithUuid(
          variantFileName,
          category,
          userId,
          sharedUuid,
        );

        const command = new PutObjectCommand({
          Bucket: this.s3Config.bucketName,
          Key: variantKey,
          Body: processedImage.buffer,
          ContentType: processedImage.contentType,
        });

        const result = await this.s3Client.send(command);

        return {
          key: variantKey,
          url: this.getPublicUrl(variantKey),
          size: processedImage.size,
          width: processedImage.width,
          height: processedImage.height,
          contentType: processedImage.contentType,
          fileSize: processedImage.buffer.length,
          etag: result.ETag,
        } as ImageVariantMetadata;
      });

      const variants = await Promise.all(uploadPromises);

      // Find the largest variant as the main result (large is now the highest quality)
      const mainVariant =
        variants.find((v) => v.size === ImageSize.LARGE) ||
        variants.find((v) => v.size === ImageSize.MEDIUM) ||
        variants[variants.length - 1];

      // Log compression statistics
      if (processedImages.length > 0) {
        const stats = this.imageProcessingService!.getCompressionStats(buffer, processedImages);
        LoggingUtil.log(
          `Image processing stats for ${fileName}: ` +
            `Original: ${this.formatBytes(stats.originalSize)}, ` +
            `Compressed: ${this.formatBytes(stats.totalCompressedSize)}, ` +
            `Savings: ${stats.savingsPercent.toFixed(1)}%, ` +
            `Variants: ${variants.length}`,
        );
      }

      return {
        key: mainVariant.key,
        url: mainVariant.url,
        bucket: this.s3Config.bucketName,
        size: mainVariant.fileSize,
        contentType: mainVariant.contentType,
        etag: mainVariant.etag,
        variants: variants.filter((v) => v !== mainVariant),
        isProcessed: true,
      };
    } catch (error: unknown) {
      const storageError = this.handleStorageError(error, 'uploadWithImageProcessing');
      LoggingUtil.error(
        `Failed to upload file with image processing: ${fileName}`,
        storageError.stack,
      );

      // Do NOT fallback to storing original files - throw error instead
      LoggingUtil.error(
        `Image processing failed for: ${fileName}. Original file will NOT be stored.`,
      );
      throw new InternalServerErrorException(
        'Image processing failed. Please try again or use a different image format.',
      );
    }
  }

  /**
   * Determine if image should be processed based on content type and category
   */
  private shouldProcessImage(contentType: string, category: FileCategory): boolean {
    if (!this.imageProcessingService) {
      return false;
    }

    // Only process images for profile and property categories
    const processableCategories = [FileCategory.PROFILE_IMAGES, FileCategory.PROPERTY_IMAGES];
    if (!processableCategories.includes(category)) {
      return false;
    }

    return this.imageProcessingService.isImageProcessingSupported(contentType);
  }

  /**
   * Format bytes to human readable string
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Convert unknown error to StorageError for better error handling
   */
  private handleStorageError(error: unknown, context: string): StorageError {
    if (error instanceof Error) {
      const storageError: StorageError = {
        ...error,
        name: 'StorageError',
        message: error.message,
        stack: error.stack,
        code: 'STORAGE_ERROR',
        details: { context },
      };
      return storageError;
    }

    return {
      name: 'StorageError',
      message: `Unknown error in ${context}: ${String(error)}`,
      code: 'UNKNOWN_STORAGE_ERROR',
      details: { context, error },
    };
  }

  /**
   * Get specific image variant URL
   */
  getImageVariantUrl(baseKey: string, size: ImageSize, format = 'webp'): string {
    const keyParts = baseKey.split('/');
    const fileName = keyParts[keyParts.length - 1];
    const nameWithoutExt = fileName.replace(/\.[^/.]+$/, '');
    const newFileName = `${nameWithoutExt}_${size}.${format === 'jpeg' ? 'jpg' : format}`;

    const newKey = [...keyParts.slice(0, -1), newFileName].join('/');
    return this.getPublicUrl(newKey);
  }
}
