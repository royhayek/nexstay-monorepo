/**
 * File utility interfaces for type-safe file operations
 * Provides comprehensive typing for file handling across the application
 */

export interface FileReadOptions {
  encoding?: BufferEncoding | 'buffer';
  fallbackContent?: string;
  validateExists?: boolean;
  maxSize?: number;
  context?: string;
}

export interface FileWriteOptions {
  encoding?: BufferEncoding | 'buffer';
  createDir?: boolean;
  mode?: number;
  flag?: string;
  context?: string;
}

export interface FileValidationOptions {
  maxSize?: number;
  allowedMimeTypes?: string[];
  allowedExtensions?: string[];
  checkMagicNumbers?: boolean;
  sanitizePath?: boolean;
  context?: string;
}

export interface FileInfo {
  path: string;
  size: number;
  mtime: Date;
  isFile: boolean;
  isDirectory: boolean;
  extension: string;
  mimeType?: string;
  exists: boolean;
}

export interface SecurityValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  sanitizedPath?: string;
}

export interface TemporaryFile {
  path: string;
  cleanup: () => Promise<void>;
  isValid: () => Promise<boolean>;
}
