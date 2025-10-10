import { ApiProperty } from '@nestjs/swagger';
import { BaseResponseDto, createResponseDto } from '../../../common/dto/base-response.dto';
import { PropertyResponseDto } from './property-response.dto';
import { ImageVariantMetadata } from '../../storage/interfaces/storage.interfaces';

/**
 * Image variant metadata DTO for Swagger documentation
 */
class ImageVariantDto {
  @ApiProperty({ description: 'Image variant key', example: 'properties/image_123_medium.jpg' })
  key: string;

  @ApiProperty({
    description: 'Image variant URL',
    example: 'https://s3.amazonaws.com/bucket/properties/image_123_medium.jpg',
  })
  url: string;

  @ApiProperty({ description: 'Image size variant', example: 'MEDIUM' })
  size: string;

  @ApiProperty({ description: 'Image width in pixels', example: 1024 })
  width: number;

  @ApiProperty({ description: 'Image height in pixels', example: 768 })
  height: number;

  @ApiProperty({ description: 'Content type', example: 'image/webp' })
  contentType: string;

  @ApiProperty({ description: 'File size in bytes', example: 102400 })
  fileSize: number;

  @ApiProperty({ description: 'ETag from S3', required: false, example: '"abc123def456"' })
  etag?: string;
}

/**
 * Property list data DTO
 */
export class PropertyListDataDto {
  @ApiProperty({ type: [PropertyResponseDto] })
  properties: PropertyResponseDto[];
}

/**
 * Property deletion result DTO
 */
export class PropertyDeletionDataDto {
  @ApiProperty({ description: 'Indicates if property was deleted', example: true })
  deleted: boolean;

  @ApiProperty({ description: 'Deleted property ID', example: '507f1f77bcf86cd799439011' })
  propertyId: string;
}

/**
 * Image upload result DTO
 */
export class ImageUploadDataDto {
  @ApiProperty({ description: 'Uploaded image key', example: 'properties/image_123.jpg' })
  key: string;

  @ApiProperty({
    description: 'Image URL',
    example: 'https://s3.amazonaws.com/bucket/properties/image_123.jpg',
  })
  url: string;

  @ApiProperty({
    description: 'Thumbnail URL',
    example: 'https://s3.amazonaws.com/bucket/properties/image_123_thumb.jpg',
  })
  thumbnailUrl: string;

  @ApiProperty({ description: 'Image variants', type: [ImageVariantDto] })
  variants: ImageVariantMetadata[];
}

/**
 * Multiple image upload result DTO
 */
export class MultipleImageUploadDataDto {
  @ApiProperty({ type: [ImageUploadDataDto] })
  files: ImageUploadDataDto[];

  @ApiProperty({ description: 'Number of uploaded files', example: 3 })
  count: number;
}

/**
 * Image deletion result DTO
 */
export class ImageDeletionDataDto {
  @ApiProperty({ description: 'Indicates if image was deleted', example: true })
  deleted: boolean;

  @ApiProperty({ description: 'Deleted image key', example: 'properties/image_123.jpg' })
  key: string;
}

// Create typed response DTOs using the factory
export const PropertyListResponseDto = createResponseDto(PropertyListDataDto);
export const SinglePropertyResponseDto = createResponseDto(PropertyResponseDto);
export const PropertyDeletionResponseDto = createResponseDto(PropertyDeletionDataDto);
export const ImageUploadResponseDto = createResponseDto(ImageUploadDataDto);
export const MultipleImageUploadResponseDto = createResponseDto(MultipleImageUploadDataDto);
export const ImageDeletionResponseDto = createResponseDto(ImageDeletionDataDto);

// Type aliases for return types
export type PropertyListResponse = BaseResponseDto<PropertyListDataDto>;
export type SinglePropertyResponse = BaseResponseDto<PropertyResponseDto>;
export type PropertyDeletionResponse = BaseResponseDto<PropertyDeletionDataDto>;
export type ImageUploadResponse = BaseResponseDto<ImageUploadDataDto>;
export type MultipleImageUploadResponse = BaseResponseDto<MultipleImageUploadDataDto>;
export type ImageDeletionResponse = BaseResponseDto<ImageDeletionDataDto>;
