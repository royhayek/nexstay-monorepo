import { ApiProperty } from '@nestjs/swagger';
import { BaseResponseDto } from '../../../common/dto/base-response.dto';

export class RefreshTokenDataDto {
  @ApiProperty({
    type: String,
    description: 'New JWT access token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  accessToken!: string;

  @ApiProperty({
    type: String,
    description: 'New refresh token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  refreshToken!: string;
}

export class RefreshTokenResponseDto extends BaseResponseDto<RefreshTokenDataDto> {
  @ApiProperty({
    description: 'Token refresh data',
    type: RefreshTokenDataDto,
  })
  declare data: RefreshTokenDataDto;
}
