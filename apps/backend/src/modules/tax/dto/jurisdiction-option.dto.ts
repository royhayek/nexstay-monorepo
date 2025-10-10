import { ApiProperty } from '@nestjs/swagger';
import { TaxJurisdictionLevel } from '../../../common/enums/tax.enums';
import { BaseResponseDto } from '../../../common/dto/base-response.dto';

export class JurisdictionOptionDto {
  @ApiProperty({ description: 'Jurisdiction ID' })
  id: string;

  @ApiProperty({ description: 'Jurisdiction name' })
  name: string;

  @ApiProperty({ description: 'Jurisdiction code' })
  code: string;

  @ApiProperty({ enum: TaxJurisdictionLevel, description: 'Jurisdiction level' })
  level: TaxJurisdictionLevel;

  @ApiProperty({ description: 'Country code' })
  country: string;

  @ApiProperty({ description: 'State/province name', required: false })
  state?: string;

  @ApiProperty({ description: 'City name', required: false })
  city?: string;

  @ApiProperty({ description: 'Display name for dropdown' })
  displayName: string;
}

export class JurisdictionOptionsResponseDto extends BaseResponseDto<JurisdictionOptionDto[]> {
  @ApiProperty({
    description: 'List of jurisdiction options',
    type: [JurisdictionOptionDto],
  })
  declare data: JurisdictionOptionDto[];
}
