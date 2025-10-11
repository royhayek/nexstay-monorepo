import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class RefreshDto {
  @ApiProperty({
    description: 'JWT refresh token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @IsString({ message: 'validation.MUST_BE_STRING' })
  @IsNotEmpty({ message: 'validation.REQUIRED_FIELD' })
  refreshToken!: string;
}
