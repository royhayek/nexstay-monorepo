import { promises as fs } from 'fs';
import * as path from 'path';
import { createHash } from 'crypto';
import { DateUtils } from './date.utils';
import { LoggingUtil } from './logging.util';
import type {
  FileReadOptions,
  FileWriteOptions,
  FileValidationOptions,
  FileInfo,
  SecurityValidationResult,
  TemporaryFile,
} from '../interfaces/file.interfaces';

export class FileUtils {
  private static readonly MAX_PATH_LENGTH = 4096;
  private static readonly MAX_FILENAME_LENGTH = 255;
  private static readonly DANGEROUS_EXTENSIONS = [
    '.exe',
    '.bat',
    '.cmd',
    '.com',
    '.pif',
    '.scr',
    '.vbs',
    '.js',
    '.jar',
    '.app',
    '.deb',
    '.pkg',
    '.dmg',
    '.sh',
    '.csh',
    '.pl',
    '.php',
    '.asp',
    '.aspx',
  ];
  private static readonly MAGIC_NUMBERS: Record<string, Uint8Array> = {
    'image/jpeg': new Uint8Array([0xff, 0xd8, 0xff]),
    'image/png': new Uint8Array([0x89, 0x50, 0x4e, 0x47]),
    'image/gif': new Uint8Array([0x47, 0x49, 0x46, 0x38]),
    'image/webp': new Uint8Array([0x52, 0x49, 0x46, 0x46]),
    'application/pdf': new Uint8Array([0x25, 0x50, 0x44, 0x46]),
    'text/plain': new Uint8Array([]),
  };

  /**
   * Safely read a file with validation and error handling
   * @param filePath - Path to the file to read
   * @param options - Read options including encoding, fallback, etc.
   * @returns File content or fallback value
   */
  static async safeReadFile(
    filePath: string,
    options: FileReadOptions = {},
  ): Promise<string | Buffer> {
    const {
      encoding = 'utf8',
      fallbackContent,
      validateExists = true,
      maxSize,
      context = 'FileUtils',
    } = options;

    try {
      // Sanitize and validate path
      const sanitizedPath = this.sanitizePath(filePath);
      const securityResult = this.validateSecurity(sanitizedPath);

      if (!securityResult.isValid) {
        const errors = securityResult.errors.join(', ');
        LoggingUtil.error(`Security validation failed: ${errors}`, context);
        if (fallbackContent !== undefined) {
          return fallbackContent;
        }
        throw new Error(`File security validation failed: ${errors}`);
      }

      const finalPath = securityResult.sanitizedPath || sanitizedPath;

      // Check if file exists
      if (validateExists && !(await this.exists(finalPath))) {
        LoggingUtil.warn(`File not found: ${finalPath}`, context);
        if (fallbackContent !== undefined) {
          return fallbackContent;
        }
        throw new Error(`File not found: ${finalPath}`);
      }

      // Check file size if limit specified
      if (maxSize) {
        const stats = await this.getFileInfo(finalPath);
        if (stats.size > maxSize) {
          LoggingUtil.warn(
            `File size (${stats.size}) exceeds limit (${maxSize}): ${finalPath}`,
            context,
          );
          if (fallbackContent !== undefined) {
            return fallbackContent;
          }
          throw new Error(`File size exceeds limit: ${finalPath}`);
        }
      }

      // Read file
      const content = await fs.readFile(finalPath, encoding === 'buffer' ? undefined : encoding);
      LoggingUtil.debug(`Successfully read file: ${finalPath}`, context);
      return content;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      LoggingUtil.error(`Failed to read file ${filePath}: ${errorMessage}`, context);

      if (fallbackContent !== undefined) {
        return fallbackContent;
      }
      throw error;
    }
  }

  /**
   * Safely write a file with directory creation and validation
   * @param filePath - Path to the file to write
   * @param content - Content to write
   * @param options - Write options
   */
  static async safeWriteFile(
    filePath: string,
    content: string | Buffer,
    options: FileWriteOptions = {},
  ): Promise<void> {
    const {
      encoding = 'utf8',
      createDir = true,
      mode = 0o644,
      flag = 'w',
      context = 'FileUtils',
    } = options;

    try {
      // Sanitize and validate path
      const sanitizedPath = this.sanitizePath(filePath);
      const securityResult = this.validateSecurity(sanitizedPath);

      if (!securityResult.isValid) {
        const errors = securityResult.errors.join(', ');
        throw new Error(`File security validation failed: ${errors}`);
      }

      const finalPath = securityResult.sanitizedPath || sanitizedPath;

      // Create directory if needed
      if (createDir) {
        const directory = path.dirname(finalPath);
        await this.ensureDirectory(directory);
      }

      // Write file
      const writeOptions: Parameters<typeof fs.writeFile>[2] = {
        encoding: encoding === 'buffer' ? undefined : encoding,
        mode,
        flag,
      };

      await fs.writeFile(finalPath, content, writeOptions);
      LoggingUtil.debug(`Successfully wrote file: ${finalPath}`, context);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      LoggingUtil.error(`Failed to write file ${filePath}: ${errorMessage}`, context);
      throw error;
    }
  }

  /**
   * Check if file or directory exists
   * @param filePath - Path to check
   * @returns true if exists, false otherwise
   */
  static async exists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get comprehensive file information
   * @param filePath - Path to the file
   * @returns File information object
   */
  static async getFileInfo(filePath: string): Promise<FileInfo> {
    try {
      const stats = await fs.stat(filePath);
      const extension = path.extname(filePath).toLowerCase();

      return {
        path: filePath,
        size: stats.size,
        mtime: stats.mtime,
        isFile: stats.isFile(),
        isDirectory: stats.isDirectory(),
        extension,
        exists: true,
      };
    } catch {
      return {
        path: filePath,
        size: 0,
        mtime: DateUtils.create(0),
        isFile: false,
        isDirectory: false,
        extension: path.extname(filePath).toLowerCase(),
        exists: false,
      };
    }
  }

  /**
   * Validate file for security and content requirements
   * @param file - File buffer or path
   * @param options - Validation options
   * @returns Validation result
   */
  static async validateFile(
    file: Buffer | string,
    options: FileValidationOptions = {},
  ): Promise<SecurityValidationResult> {
    const {
      maxSize,
      allowedMimeTypes = [],
      allowedExtensions = [],
      checkMagicNumbers = true,
      context = 'FileUtils',
    } = options;

    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      let buffer: Buffer;
      let filePath: string | undefined;

      // Handle file path vs buffer
      if (typeof file === 'string') {
        filePath = file;
        if (!(await this.exists(filePath))) {
          errors.push('File does not exist');
          return { isValid: false, errors, warnings };
        }
        buffer = await fs.readFile(filePath);
      } else {
        buffer = file;
      }

      // Size validation
      if (maxSize && buffer.length > maxSize) {
        errors.push(`File size (${buffer.length}) exceeds maximum allowed size (${maxSize})`);
      }

      // Extension validation
      if (filePath && allowedExtensions.length > 0) {
        const extension = path.extname(filePath).toLowerCase();
        if (!allowedExtensions.includes(extension)) {
          errors.push(`File extension ${extension} is not allowed`);
        }
      }

      // Magic number validation
      if (checkMagicNumbers && allowedMimeTypes.length > 0) {
        const detectedMimeType = this.detectMimeType(buffer);
        if (detectedMimeType && !allowedMimeTypes.includes(detectedMimeType)) {
          errors.push(`File content type ${detectedMimeType} is not allowed`);
        }
      }

      // Check for dangerous extensions
      if (filePath) {
        const extension = path.extname(filePath).toLowerCase();
        if (this.DANGEROUS_EXTENSIONS.includes(extension)) {
          errors.push(`Potentially dangerous file extension: ${extension}`);
        }
      }

      // Content validation
      const contentValidation = this.validateFileContent(buffer);
      if (contentValidation.warnings.length > 0) {
        warnings.push(...contentValidation.warnings);
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      LoggingUtil.error(`File validation failed: ${errorMessage}`, context);
      errors.push(`Validation error: ${errorMessage}`);
      return { isValid: false, errors, warnings };
    }
  }

  /**
   * Sanitize file path to prevent directory traversal and other attacks
   * @param filePath - Path to sanitize
   * @returns Sanitized path
   */
  static sanitizePath(filePath: string): string {
    if (!filePath) {
      throw new Error('File path cannot be empty');
    }

    // Resolve path to handle relative paths and normalize
    let sanitized = path.resolve(filePath);

    // Remove null bytes and other dangerous characters
    sanitized = sanitized.replace(/\0/g, '');

    // Normalize path separators
    sanitized = path.normalize(sanitized);

    // Check for path traversal attempts
    if (sanitized.includes('..')) {
      throw new Error('Path traversal detected');
    }

    // Check path length limits
    if (sanitized.length > this.MAX_PATH_LENGTH) {
      throw new Error(`Path length exceeds maximum allowed length (${this.MAX_PATH_LENGTH})`);
    }

    const filename = path.basename(sanitized);
    if (filename.length > this.MAX_FILENAME_LENGTH) {
      throw new Error(
        `Filename length exceeds maximum allowed length (${this.MAX_FILENAME_LENGTH})`,
      );
    }

    return sanitized;
  }

  /**
   * Ensure directory exists, creating it if necessary
   * @param dirPath - Directory path
   */
  static async ensureDirectory(dirPath: string): Promise<void> {
    try {
      const sanitizedPath = this.sanitizePath(dirPath);
      await fs.mkdir(sanitizedPath, { recursive: true, mode: 0o755 });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      LoggingUtil.error(`Failed to ensure directory ${dirPath}: ${errorMessage}`, 'FileUtils');
      throw error;
    }
  }

  /**
   * Safely delete a file or directory
   * @param filePath - Path to delete
   * @param options - Delete options
   */
  static async safeDelete(
    filePath: string,
    options: { recursive?: boolean; context?: string } = {},
  ): Promise<boolean> {
    const { recursive = false, context = 'FileUtils' } = options;

    try {
      const sanitizedPath = this.sanitizePath(filePath);

      if (!(await this.exists(sanitizedPath))) {
        LoggingUtil.debug(`File does not exist, nothing to delete: ${sanitizedPath}`, context);
        return false;
      }

      const info = await this.getFileInfo(sanitizedPath);

      if (info.isDirectory && recursive) {
        await fs.rm(sanitizedPath, { recursive: true, force: true });
      } else if (info.isFile) {
        await fs.unlink(sanitizedPath);
      } else {
        throw new Error('Cannot delete directory without recursive option');
      }

      LoggingUtil.debug(`Successfully deleted: ${sanitizedPath}`, context);
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      LoggingUtil.error(`Failed to delete ${filePath}: ${errorMessage}`, context);
      throw error;
    }
  }

  /**
   * Create a temporary file with automatic cleanup
   * @param prefix - Filename prefix
   * @param suffix - Filename suffix
   * @returns Temporary file object with cleanup function
   */
  static async createTemporaryFile(prefix = 'temp', suffix = '.tmp'): Promise<TemporaryFile> {
    const timestamp = DateUtils.format(DateUtils.now(), 'yyyyMMdd-HHmmss');
    const random = Math.random().toString(36).substring(2, 15);
    const filename = `${prefix}_${timestamp}_${random}${suffix}`;
    const tempDir = await this.getTempDirectory();
    const tempPath = path.join(tempDir, filename);

    // Create empty file
    await this.safeWriteFile(tempPath, '', { context: 'FileUtils.createTemporaryFile' });

    return {
      path: tempPath,
      cleanup: async () => {
        try {
          await this.safeDelete(tempPath, { context: 'FileUtils.TemporaryFile.cleanup' });
        } catch {
          // Ignore cleanup errors
        }
      },
      isValid: async () => await this.exists(tempPath),
    };
  }

  /**
   * Calculate file hash for integrity checking
   * @param filePath - Path to the file
   * @param algorithm - Hash algorithm (default: sha256)
   * @returns File hash
   */
  static async calculateFileHash(filePath: string, algorithm = 'sha256'): Promise<string> {
    try {
      const buffer = (await this.safeReadFile(filePath, { encoding: 'buffer' })) as Buffer;
      const hash = createHash(algorithm);
      hash.update(buffer);
      return hash.digest('hex');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      LoggingUtil.error(`Failed to calculate hash for ${filePath}: ${errorMessage}`, 'FileUtils');
      throw error;
    }
  }

  /**
   * Copy file with validation and error handling
   * @param sourcePath - Source file path
   * @param destinationPath - Destination file path
   * @param options - Copy options
   */
  static async safeCopyFile(
    sourcePath: string,
    destinationPath: string,
    options: { preserveTimestamps?: boolean; context?: string } = {},
  ): Promise<void> {
    const { preserveTimestamps = false, context = 'FileUtils' } = options;

    try {
      const sanitizedSource = this.sanitizePath(sourcePath);
      const sanitizedDest = this.sanitizePath(destinationPath);

      if (!(await this.exists(sanitizedSource))) {
        throw new Error(`Source file does not exist: ${sanitizedSource}`);
      }

      // Create destination directory if needed
      const destDir = path.dirname(sanitizedDest);
      await this.ensureDirectory(destDir);

      // Copy file
      await fs.copyFile(sanitizedSource, sanitizedDest);

      // Preserve timestamps if requested
      if (preserveTimestamps) {
        const sourceInfo = await this.getFileInfo(sanitizedSource);
        await fs.utimes(sanitizedDest, sourceInfo.mtime, sourceInfo.mtime);
      }

      LoggingUtil.debug(
        `Successfully copied file from ${sanitizedSource} to ${sanitizedDest}`,
        context,
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      LoggingUtil.error(
        `Failed to copy file from ${sourcePath} to ${destinationPath}: ${errorMessage}`,
        context,
      );
      throw error;
    }
  }

  /**
   * Get or create system temporary directory
   * @returns Path to temporary directory
   */
  static async getTempDirectory(): Promise<string> {
    const tmpDir = process.env.TMPDIR || process.env.TMP || process.env.TEMP || '/tmp';
    await this.ensureDirectory(tmpDir);
    return tmpDir;
  }

  /**
   * Generate a safe filename from user input
   * @param input - User input string
   * @param extension - File extension to append
   * @returns Safe filename
   */
  static generateSafeFilename(input: string, extension = ''): string {
    if (!input) {
      const timestamp = DateUtils.format(DateUtils.now(), 'yyyyMMdd-HHmmss');
      return `file_${timestamp}${extension}`;
    }

    // Remove dangerous characters and normalize
    let safe = input
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove accents
      .replace(/[^a-zA-Z0-9._-]/g, '_') // Replace special chars with underscore
      .replace(/_{2,}/g, '_') // Collapse multiple underscores
      .replace(/^[._-]+|[._-]+$/g, '') // Remove leading/trailing special chars
      .substring(0, this.MAX_FILENAME_LENGTH - extension.length - 10); // Reserve space

    if (!safe) {
      const timestamp = DateUtils.format(DateUtils.now(), 'yyyyMMdd-HHmmss');
      safe = `file_${timestamp}`;
    }

    return safe + extension;
  }

  // Private helper methods

  /**
   * Validate file path security
   */
  private static validateSecurity(filePath: string): SecurityValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Check for directory traversal
      const resolved = path.resolve(filePath);
      const normalized = path.normalize(filePath);

      if (normalized.includes('..')) {
        errors.push('Directory traversal detected');
      }

      // Check for dangerous extensions
      const extension = path.extname(filePath).toLowerCase();
      if (this.DANGEROUS_EXTENSIONS.includes(extension)) {
        warnings.push(`Potentially dangerous file extension: ${extension}`);
      }

      // Check path length
      if (resolved.length > this.MAX_PATH_LENGTH) {
        errors.push(`Path length exceeds maximum (${this.MAX_PATH_LENGTH})`);
      }

      const filename = path.basename(filePath);
      if (filename.length > this.MAX_FILENAME_LENGTH) {
        errors.push(`Filename length exceeds maximum (${this.MAX_FILENAME_LENGTH})`);
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings,
        sanitizedPath: resolved,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      errors.push(`Path validation error: ${errorMessage}`);
      return { isValid: false, errors, warnings };
    }
  }

  /**
   * Detect MIME type from file content using magic numbers
   */
  private static detectMimeType(buffer: Buffer): string | null {
    for (const [mimeType, signature] of Object.entries(this.MAGIC_NUMBERS)) {
      if (signature.length === 0) continue; // Skip empty signatures

      if (buffer.length >= signature.length) {
        const fileHeader = buffer.subarray(0, signature.length);
        if (fileHeader.every((byte, index) => byte === signature[index])) {
          return mimeType;
        }
      }
    }
    return null;
  }

  /**
   * Validate file content for suspicious patterns
   */
  private static validateFileContent(buffer: Buffer): { warnings: string[] } {
    const warnings: string[] = [];

    // Check for embedded scripts in files
    const content = buffer.toString('utf8', 0, Math.min(buffer.length, 4096));

    // Check for script tags
    if (/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi.test(content)) {
      warnings.push('File contains script tags');
    }

    // Check for PHP tags
    if (/<\?php/gi.test(content)) {
      warnings.push('File contains PHP code');
    }

    // Check for suspicious patterns
    if (/eval\s*\(|exec\s*\(|system\s*\(/gi.test(content)) {
      warnings.push('File contains potentially dangerous function calls');
    }

    return { warnings };
  }
}

// File type detection utilities
export const FileTypeUtils = {
  isImage: (mimeType: string): boolean => mimeType.startsWith('image/'),

  isDocument: (mimeType: string): boolean =>
    ['application/pdf', 'text/plain', 'text/csv', 'application/json'].includes(mimeType),

  isArchive: (mimeType: string): boolean =>
    ['application/zip', 'application/x-tar', 'application/gzip'].includes(mimeType),

  getExtensionFromMimeType: (mimeType: string): string => {
    const map: Record<string, string> = {
      'image/jpeg': '.jpg',
      'image/png': '.png',
      'image/gif': '.gif',
      'image/webp': '.webp',
      'application/pdf': '.pdf',
      'text/plain': '.txt',
      'text/csv': '.csv',
      'application/json': '.json',
      'application/zip': '.zip',
    };
    return map[mimeType] || '';
  },
};

// Template utilities for common file operations
export const TemplateUtils = {
  /**
   * Read and compile a Handlebars template file safely
   */
  async readTemplate(templatePath: string, fallbackPath?: string): Promise<string> {
    try {
      return (await FileUtils.safeReadFile(templatePath, {
        encoding: 'utf8',
        context: 'TemplateUtils',
      })) as string;
    } catch (error) {
      if (fallbackPath) {
        LoggingUtil.warn(
          `Failed to read template ${templatePath}, trying fallback: ${fallbackPath}`,
          'TemplateUtils',
        );
        return (await FileUtils.safeReadFile(fallbackPath, {
          encoding: 'utf8',
          context: 'TemplateUtils.fallback',
        })) as string;
      }
      throw error;
    }
  },

  /**
   * Generate template path with proper extension and validation
   */
  getTemplatePath(baseDir: string, templateName: string, extension = '.hbs'): string {
    const safeTemplateName = FileUtils.generateSafeFilename(templateName, extension);
    return path.join(baseDir, safeTemplateName);
  },
};
