import { ApiProperty } from '@nestjs/swagger';
import { BaseResponseDto } from '../../../common/dto/base-response.dto';
import { UserDataDto } from './user-response.dto';
import type { UserDocument } from '../../../database/schemas/user.schema';

export class UpdateProfileDataDto {
  @ApiProperty({
    description: 'Success message',
    example: 'Profile updated successfully',
  })
  message!: string;

  @ApiProperty({
    description: 'Updated user profile data',
    type: UserDataDto,
  })
  user!: UserDataDto;
}

export class UpdateProfileServiceDataDto {
  message!: string;
  user!: UserDocument; // Raw user object from database
}

export class UpdateProfileResponseDto extends BaseResponseDto<UpdateProfileDataDto> {
  @ApiProperty({
    description: 'Profile update response data',
    type: UpdateProfileDataDto,
  })
  declare data: UpdateProfileDataDto;
}
