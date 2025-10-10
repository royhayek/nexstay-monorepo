/**
 * Cross-module interfaces to eliminate direct DTO imports
 * Provides type safety without tight coupling
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// Property-related interfaces used by other modules
export interface PropertyImageVariant {
  size: string;
  url: string;
  width?: number;
  height?: number;
}

export interface PropertyImageInfo {
  originalName: string;
  s3Key: string;
  url: string;
  variants: PropertyImageVariant[];
}

// DTO classes for cross-module use (needed for ApiProperty decorators)
export class PropertyImageVariantDto {
  @ApiProperty({ description: 'Size identifier for the image variant' })
  size: string;

  @ApiProperty({ description: 'URL of the image variant' })
  url: string;

  @ApiPropertyOptional({ description: 'Width in pixels' })
  width?: number;

  @ApiPropertyOptional({ description: 'Height in pixels' })
  height?: number;
}

export class PropertyImageInfoDto {
  @ApiProperty({ description: 'Original filename' })
  originalName: string;

  @ApiProperty({ description: 'S3 object key' })
  s3Key: string;

  @ApiProperty({ description: 'Main image URL' })
  url: string;

  @ApiProperty({
    description: 'Image variants for different sizes',
    type: [PropertyImageVariantDto],
  })
  variants: PropertyImageVariantDto[];
}

// User-related interfaces used by other modules
export interface UserSummaryInfo {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  avatarUrl?: string;
}

// Booking-related interfaces used by other modules
export interface BookingReference {
  id: string;
  confirmationCode: string;
  status: string;
  checkIn: Date;
  checkOut: Date;
}

/**
 * Usage Example:
 * Instead of: import { PropertyImageUploadDto } from '../../properties/dto/...'
 * Use: PropertyImageInfo interface from this file
 *
 * Benefits:
 * - Eliminates direct module coupling
 * - Provides stable interfaces that won't break with internal DTO changes
 * - Improves maintainability
 */
