import { Injectable } from '@nestjs/common';
import { LoggingUtil } from '../../../common/utils/logging.util';
import sharp from 'sharp';

export interface ProcessedImage {
  buffer: Buffer;
  format: string;
  size: ImageSize;
  width: number;
  height: number;
  contentType: string;
}

export interface ImageVariant {
  suffix: string;
  width?: number;
  height?: number;
  quality: number;
  progressive?: boolean;
  format?: 'webp' | 'jpeg' | 'png';
}

export enum ImageSize {
  THUMBNAIL = 'thumbnail',
  MEDIUM = 'medium',
  LARGE = 'large',
}

@Injectable()
export class ImageProcessingService {
  // Airbnb-optimized image sizes for different use cases
  private readonly profileImageVariants: Record<string, ImageVariant> = {
    thumbnail: {
      suffix: '_thumb',
      width: 64,
      height: 64,
      quality: 85,
      progressive: true,
      format: 'webp',
    },
    small: {
      suffix: '_sm',
      width: 150,
      height: 150,
      quality: 90,
      progressive: true,
      format: 'webp',
    },
    medium: {
      suffix: '_md',
      width: 300,
      height: 300,
      quality: 92,
      progressive: true,
      format: 'webp',
    },
  };

  // Optimized property image variants - only essential sizes
  private readonly propertyImageVariants: Record<string, ImageVariant> = {
    thumbnail: {
      suffix: '_thumb',
      width: 320,
      height: 240,
      quality: 80,
      progressive: true,
      format: 'webp',
    },
    medium: {
      suffix: '_md',
      width: 1024,
      height: 768,
      quality: 90,
      progressive: true,
      format: 'webp',
    },
    large: {
      suffix: '_lg',
      width: 1920,
      height: 1080,
      quality: 95, // Higher quality for large displays
      progressive: true,
      format: 'webp',
    },
  };

  /**
   * Process profile image with multiple variants optimized for Airbnb profile displays
   */
  async processProfileImage(inputBuffer: Buffer, fileName: string): Promise<ProcessedImage[]> {
    try {
      const results: ProcessedImage[] = [];
      const image = sharp(inputBuffer);

      // Get original image metadata
      const metadata = await image.metadata();
      LoggingUtil.log(
        `Processing profile image: ${fileName} (${metadata.width || 0}x${metadata.height || 0})`,
      );

      // Process each variant
      for (const [sizeName, variant] of Object.entries(this.profileImageVariants)) {
        const processedImage = await this.processImageVariant(
          image.clone(),
          variant,
          sizeName as ImageSize,
        );
        results.push(processedImage);
      }

      // Add large variant in WebP format with high quality
      const largeWebP = await this.processImageVariant(
        image.clone(),
        {
          suffix: '_lg',
          quality: 95,
          progressive: true,
          format: 'webp',
        },
        ImageSize.LARGE,
      );
      results.push(largeWebP);

      LoggingUtil.log(`Generated ${results.length} variants for profile image: ${fileName}`);
      return results;
    } catch (error) {
      LoggingUtil.errorWithException(`Failed to process profile image: ${fileName}`, error);
      throw new Error(
        `Image processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Process property image with multiple variants optimized for Airbnb property listings
   */
  async processPropertyImage(inputBuffer: Buffer, fileName: string): Promise<ProcessedImage[]> {
    try {
      const results: ProcessedImage[] = [];
      const image = sharp(inputBuffer);

      // Get original image metadata
      const metadata = await image.metadata();
      LoggingUtil.log(
        `Processing property image: ${fileName} (${metadata.width || 0}x${metadata.height || 0})`,
      );

      // Process only the essential variants (thumbnail, medium, large)
      for (const [sizeName, variant] of Object.entries(this.propertyImageVariants)) {
        const processedImage = await this.processImageVariant(
          image.clone(),
          variant,
          this.mapVariantNameToSize(sizeName),
        );
        results.push(processedImage);
      }

      // Note: Original file is NOT stored - large variant serves as highest quality version

      LoggingUtil.log(`Generated ${results.length} variants for property image: ${fileName}`);
      return results;
    } catch (error) {
      LoggingUtil.errorWithException(`Failed to process property image: ${fileName}`, error);
      throw new Error(
        `Image processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Process a single image variant
   */
  private async processImageVariant(
    sharpInstance: sharp.Sharp,
    variant: ImageVariant,
    size: ImageSize,
  ): Promise<ProcessedImage> {
    try {
      // Apply transformations
      let processedSharp = sharpInstance;

      // Resize with smart cropping if dimensions specified
      if (variant.width || variant.height) {
        processedSharp = processedSharp.resize(variant.width, variant.height, {
          fit: 'cover',
          position: 'center',
          withoutEnlargement: true,
        });
      }

      // Remove metadata for privacy and smaller file size
      processedSharp = processedSharp.withMetadata({
        density: 72, // Standard web density
        icc: 'sRGB', // Standard web color profile
      });

      // Apply format-specific optimizations
      let buffer: Buffer;
      let contentType: string = 'image/webp'; // Default to webp
      let actualFormat: string;

      switch (variant.format) {
        case 'webp':
          buffer = await processedSharp
            .webp({
              quality: variant.quality,
              effort: 6, // High compression effort
              smartSubsample: true,
            })
            .toBuffer();
          contentType = 'image/webp';
          actualFormat = 'webp';
          break;

        case 'jpeg':
          buffer = await processedSharp
            .jpeg({
              quality: variant.quality,
              progressive: variant.progressive,
              mozjpeg: true, // Better compression
              trellisQuantisation: true,
              overshootDeringing: true,
              optimizeScans: true,
            })
            .toBuffer();
          contentType = 'image/jpeg';
          actualFormat = 'jpeg';
          break;

        case 'png':
          buffer = await processedSharp
            .png({
              quality: variant.quality,
              progressive: variant.progressive,
              compressionLevel: 9,
              palette: true, // Use palette when possible
            })
            .toBuffer();
          contentType = 'image/png';
          actualFormat = 'png';
          break;

        default:
          // Default to WebP for best compression
          buffer = await processedSharp
            .webp({
              quality: variant.quality,
              effort: 6,
              smartSubsample: true,
            })
            .toBuffer();
          actualFormat = 'webp';
      }

      // Get final dimensions
      const finalSharp = sharp(buffer);
      const finalMetadata = await finalSharp.metadata();

      return {
        buffer,
        format: actualFormat,
        size,
        width: finalMetadata.width || 0,
        height: finalMetadata.height || 0,
        contentType,
      };
    } catch (error) {
      LoggingUtil.errorWithException(`Failed to process image variant: ${variant.suffix}`, error);
      throw error;
    }
  }

  /**
   * Get the appropriate image variants based on category
   */
  getImageVariants(category: 'profile' | 'property'): Record<string, ImageVariant> {
    return category === 'profile' ? this.profileImageVariants : this.propertyImageVariants;
  }

  /**
   * Map variant name to ImageSize enum
   */
  private mapVariantNameToSize(variantName: string): ImageSize {
    if (variantName.includes('thumb')) return ImageSize.THUMBNAIL;
    if (variantName.includes('md')) return ImageSize.MEDIUM;
    if (variantName.includes('lg')) return ImageSize.LARGE;
    // Default to medium if no match
    return ImageSize.MEDIUM;
  }

  /**
   * Validate if image processing is supported for the given format
   */
  isImageProcessingSupported(contentType: string): boolean {
    const supportedFormats = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/tiff',
      'image/gif', // Sharp can read GIF but will convert to static
    ];
    return supportedFormats.includes(contentType.toLowerCase());
  }

  /**
   * Get optimal file name for processed image
   */
  getProcessedFileName(originalFileName: string, variant: ImageVariant, format: string): string {
    const nameWithoutExt = originalFileName.replace(/\.[^/.]+$/, '');
    const extension = format === 'jpeg' ? 'jpg' : format;
    return `${nameWithoutExt}${variant.suffix}.${extension}`;
  }

  /**
   * Calculate expected compression savings
   */
  getCompressionStats(
    originalBuffer: Buffer,
    processedImages: ProcessedImage[],
  ): {
    originalSize: number;
    totalCompressedSize: number;
    compressionRatio: number;
    savingsPercent: number;
  } {
    const originalSize = originalBuffer.length;
    const totalCompressedSize = processedImages.reduce((sum, img) => sum + img.buffer.length, 0);

    const compressionRatio = originalSize / totalCompressedSize;
    const savingsPercent = ((originalSize - totalCompressedSize) / originalSize) * 100;

    return {
      originalSize,
      totalCompressedSize,
      compressionRatio,
      savingsPercent,
    };
  }
}
