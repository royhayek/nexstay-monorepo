import { Observable } from 'rxjs';
import { ExecutionContext, CallHandler } from '@nestjs/common';
import { FileCategory } from '../services/s3.service';
import { ImageSize } from '../services/image-processing.service';

export interface StorageInterceptorResult {
  status: 'success' | 'error';
  data?: unknown;
  error?: string;
}

export interface FileUploadInterceptorOptions {
  category: FileCategory;
  maxFileSize?: number;
  allowedMimeTypes?: string[];
}

export interface StorageInterceptor {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<StorageInterceptorResult> | Promise<Observable<StorageInterceptorResult>>;
}

export interface ImageVariantMetadata {
  key: string;
  url: string;
  size: ImageSize;
  width: number;
  height: number;
  contentType: string;
  fileSize: number;
  etag?: string;
}

export interface FileUploadMetadata {
  key: string;
  url: string;
  bucket: string;
  size: number;
  contentType: string;
  category: FileCategory;
  isProcessed?: boolean;
  variants?: ImageVariantMetadata[];
  etag?: string;
}

export interface StorageError extends Error {
  code?: string;
  statusCode?: number;
  details?: unknown;
}

export interface PresignedUrlMetadata {
  uploadUrl: string;
  key: string;
  expiresIn: number;
  fields?: Record<string, string>;
}

export interface FileValidationResult {
  isValid: boolean;
  error?: string;
  warnings?: string[];
}

// Request interfaces for controllers
export interface FileDeleteRequest {
  url: string;
  reason?: string;
}

export interface FileBulkDeleteRequest {
  category?: string;
  daysOld?: number;
  dryRun?: boolean;
}

export interface FilePresignedUrlRequest {
  fileName: string;
  fileType: string;
  category: string;
}

export interface CategoryRequest {
  category: FileCategory;
}

// Response data interfaces
export interface CategoryBreakdownData {
  [category: string]: number;
}
