import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { SystemEnumName, SystemEnumValue } from '../../../common/enums/system.enums';
import { BaseResponseDto } from '../../../common/dto/base-response.dto';

export class EnumDisplayDataDto {
  @ApiProperty()
  _id: string;

  @ApiProperty({ type: String })
  enumName: SystemEnumName;

  @ApiProperty({ type: String })
  key: SystemEnumValue;

  @ApiProperty({ description: 'Localized labels' })
  label: Record<string, string>;

  @ApiPropertyOptional()
  sortOrder?: number;

  @ApiPropertyOptional()
  isVisible?: boolean;
}

export class EnumDisplayResponseDto extends BaseResponseDto<EnumDisplayDataDto> {
  @ApiProperty({
    description: 'Enum display data',
    type: EnumDisplayDataDto,
  })
  declare data: EnumDisplayDataDto;
}

export class EnumDisplayListResponseDto extends BaseResponseDto<EnumDisplayDataDto[]> {
  @ApiProperty({
    description: 'List of enum displays',
    type: [EnumDisplayDataDto],
  })
  declare data: EnumDisplayDataDto[];
}

export class EnumDisplayGroupsResponseDto extends BaseResponseDto<
  Record<string, EnumDisplayDataDto[]>
> {
  @ApiProperty({
    description: 'Grouped enum displays by enum name',
    type: 'object',
    additionalProperties: {
      type: 'array',
      items: { $ref: '#/components/schemas/EnumDisplayDataDto' },
    },
    example: {
      UserRole: [
        {
          _id: '507f1f77bcf86cd799439011',
          enumName: 'UserRole',
          key: 'ADMIN',
          label: { en: 'Administrator', fr: 'Administrateur' },
          sortOrder: 1,
          isVisible: true,
        },
      ],
      PropertyType: [
        {
          _id: '507f1f77bcf86cd799439012',
          enumName: 'PropertyType',
          key: 'APARTMENT',
          label: { en: 'Apartment', fr: 'Appartement' },
          sortOrder: 1,
          isVisible: true,
        },
      ],
    },
  })
  declare data: Record<string, EnumDisplayDataDto[]>;
}
