import { ApiProperty } from '@nestjs/swagger';
import { BaseResponseDto } from '../../../common/dto/base-response.dto';

export class CatalogDataDto {
  @ApiProperty({ example: {}, description: 'Currencies catalog data' })
  currencies?: unknown[];

  @ApiProperty({ example: {}, description: 'Enum displays catalog data' })
  enumDisplays?: unknown[];

  @ApiProperty({ example: {}, description: 'Amenity categories catalog data' })
  amenityCategories?: unknown[];

  @ApiProperty({ example: {}, description: 'Amenities catalog data' })
  amenities?: unknown[];

  @ApiProperty({ example: {}, description: 'Bed types catalog data' })
  bedTypes?: unknown[];

  @ApiProperty({ example: {}, description: 'Property types catalog data' })
  propertyTypes?: unknown[];

  @ApiProperty({ example: {}, description: 'Room types catalog data' })
  roomTypes?: unknown[];

  @ApiProperty({ example: {}, description: 'Cancellation policies catalog data' })
  cancellationPolicies?: unknown[];

  @ApiProperty({ example: {}, description: 'Notification types catalog data' })
  notificationTypes?: unknown[];

  @ApiProperty({ example: {}, description: 'Payment providers catalog data' })
  paymentProviders?: unknown[];
}

export class CatalogResponseDto extends BaseResponseDto<CatalogDataDto> {
  @ApiProperty({ type: CatalogDataDto })
  declare data: CatalogDataDto;
}
