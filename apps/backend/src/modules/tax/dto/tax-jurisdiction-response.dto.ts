import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BaseResponseDto } from '../../../common/dto/base-response.dto';
import { TaxJurisdictionLevel, TaxStatus } from '../../../common/enums/tax.enums';

class BoundariesDataDto {
  @ApiProperty({ enum: ['Polygon'], description: 'Geometry type' })
  type: 'Polygon';

  @ApiProperty({ description: 'Polygon coordinates [[[longitude, latitude]]]' })
  coordinates: number[][][];
}

export class TaxJurisdictionDataDto {
  @ApiProperty({ description: 'Jurisdiction ID' })
  _id: string;

  @ApiProperty({ description: 'Jurisdiction name' })
  name: string;

  @ApiProperty({ description: 'Jurisdiction code' })
  code: string;

  @ApiProperty({ enum: TaxJurisdictionLevel, description: 'Jurisdiction level' })
  level: TaxJurisdictionLevel;

  @ApiProperty({ description: 'Country code' })
  country: string;

  @ApiPropertyOptional({ description: 'State/Province name' })
  state?: string;

  @ApiPropertyOptional({ description: 'City name' })
  city?: string;

  @ApiPropertyOptional({ description: 'Postal code' })
  postalCode?: string;

  @ApiPropertyOptional({ description: 'Parent jurisdiction ID' })
  parentJurisdiction?: string;

  @ApiPropertyOptional({ type: BoundariesDataDto, description: 'Geographic boundaries' })
  boundaries?: BoundariesDataDto;

  @ApiProperty({ enum: TaxStatus, description: 'Jurisdiction status' })
  status: TaxStatus;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  metadata?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Description' })
  description?: string;

  @ApiProperty({ description: 'Effective from date' })
  effectiveFrom: Date;

  @ApiPropertyOptional({ description: 'Effective to date' })
  effectiveTo?: Date;

  @ApiProperty({ description: 'Creation date' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update date' })
  updatedAt: Date;
}

export class TaxJurisdictionListDataDto {
  @ApiProperty({ description: 'Tax jurisdictions', type: [TaxJurisdictionDataDto] })
  items: TaxJurisdictionDataDto[];

  @ApiProperty({ description: 'Total count' })
  total: number;

  @ApiProperty({ description: 'Current page' })
  page: number;

  @ApiProperty({ description: 'Items per page' })
  limit: number;

  @ApiProperty({ description: 'Total pages' })
  totalPages: number;

  @ApiProperty({ description: 'Has next page' })
  hasNextPage: boolean;

  @ApiProperty({ description: 'Has previous page' })
  hasPrevPage: boolean;
}

export class TaxJurisdictionResponseDto extends BaseResponseDto<TaxJurisdictionDataDto> {
  @ApiProperty({
    description: 'Tax jurisdiction data',
    type: TaxJurisdictionDataDto,
  })
  declare data: TaxJurisdictionDataDto;
}

export class TaxJurisdictionListResponseDto extends BaseResponseDto<TaxJurisdictionListDataDto> {
  @ApiProperty({
    description: 'Tax jurisdiction list data',
    type: TaxJurisdictionListDataDto,
  })
  declare data: TaxJurisdictionListDataDto;
}
