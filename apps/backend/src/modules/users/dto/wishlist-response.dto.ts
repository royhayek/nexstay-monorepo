import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { BaseResponseDto } from '../../../common/dto/base-response.dto';

/**
 * Wishlist item DTO with property details
 */
export class WishlistItemDto {
  @ApiProperty({
    description: 'Property ID',
    example: '507f1f77bcf86cd799439011',
  })
  @Expose()
  id!: string;

  @ApiProperty({
    description: 'Property name',
    example: 'Beautiful Downtown Apartment',
  })
  @Expose()
  name!: string;

  @ApiProperty({
    description: 'Price per night',
    example: 150,
  })
  @Expose()
  pricePerNight!: number;

  @ApiProperty({
    description: 'Property city',
    example: 'New York',
  })
  @Expose()
  city!: string;

  @ApiProperty({
    description: 'Property country',
    example: 'United States',
  })
  @Expose()
  country!: string;

  @ApiProperty({
    description: 'Property thumbnail URL',
    example: 'https://example.com/properties/image123_thumb.jpg',
  })
  @Expose()
  thumbnailUrl?: string;

  @ApiProperty({
    description: 'Property rating',
    example: 4.8,
    minimum: 0,
    maximum: 5,
  })
  @Expose()
  rating!: number;

  @ApiProperty({
    description: 'Number of reviews',
    example: 42,
    minimum: 0,
  })
  @Expose()
  reviewCount!: number;
}

/**
 * Wishlist data DTO
 */
export class WishlistDataDto {
  @ApiProperty({
    description: 'List of properties in wishlist',
    type: [WishlistItemDto],
  })
  @Expose()
  @Type(() => WishlistItemDto)
  properties!: WishlistItemDto[];

  @ApiProperty({
    description: 'Total number of properties in wishlist',
    example: 5,
    minimum: 0,
  })
  @Expose()
  total!: number;
}

/**
 * Add to wishlist result DTO
 */
export class AddToWishlistDataDto {
  @ApiProperty({
    description: 'Property ID that was added',
    example: '507f1f77bcf86cd799439011',
  })
  @Expose()
  propertyId!: string;

  @ApiProperty({
    description: 'Indicates the property was successfully added',
    example: true,
  })
  @Expose()
  added!: boolean;
}

/**
 * Remove from wishlist result DTO
 */
export class RemoveFromWishlistDataDto {
  @ApiProperty({
    description: 'Property ID that was removed',
    example: '507f1f77bcf86cd799439011',
  })
  @Expose()
  propertyId!: string;

  @ApiProperty({
    description: 'Indicates the property was successfully removed',
    example: true,
  })
  @Expose()
  removed!: boolean;
}

/**
 * Check wishlist status DTO
 */
export class WishlistCheckDataDto {
  @ApiProperty({
    description: 'Property ID being checked',
    example: '507f1f77bcf86cd799439011',
  })
  @Expose()
  propertyId!: string;

  @ApiProperty({
    description: 'Whether the property is in the wishlist',
    example: true,
  })
  @Expose()
  isFavorited!: boolean;
}

// Response DTOs using proper pattern
export class WishlistResponseDto extends BaseResponseDto<WishlistDataDto> {
  @ApiProperty({ type: WishlistDataDto })
  declare data: WishlistDataDto;
}

export class AddToWishlistResponseDto extends BaseResponseDto<AddToWishlistDataDto> {
  @ApiProperty({ type: AddToWishlistDataDto })
  declare data: AddToWishlistDataDto;
}

export class RemoveFromWishlistResponseDto extends BaseResponseDto<RemoveFromWishlistDataDto> {
  @ApiProperty({ type: RemoveFromWishlistDataDto })
  declare data: RemoveFromWishlistDataDto;
}

export class WishlistCheckResponseDto extends BaseResponseDto<WishlistCheckDataDto> {
  @ApiProperty({ type: WishlistCheckDataDto })
  declare data: WishlistCheckDataDto;
}
