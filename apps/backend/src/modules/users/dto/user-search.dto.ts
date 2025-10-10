import { ApiProperty } from '@nestjs/swagger';
import { BaseResponseDto } from '../../../common/dto/base-response.dto';

export class UserSearchItemDto {
  @ApiProperty({ description: 'User ID' })
  _id: string;

  @ApiProperty({ description: 'User first name' })
  firstName: string;

  @ApiProperty({ description: 'User last name' })
  lastName: string;
}

export class UserSearchListDto {
  @ApiProperty({ description: 'Users list', type: [UserSearchItemDto] })
  users: UserSearchItemDto[];

  @ApiProperty({ description: 'Total count' })
  total: number;
}

export class GuestDropdownResponseDto extends BaseResponseDto<UserSearchListDto> {
  @ApiProperty({
    description: 'Guest users search data',
    type: UserSearchListDto,
  })
  declare data: UserSearchListDto;
}

export class HostDropdownResponseDto extends BaseResponseDto<UserSearchListDto> {
  @ApiProperty({
    description: 'Host users search data',
    type: UserSearchListDto,
  })
  declare data: UserSearchListDto;
}
