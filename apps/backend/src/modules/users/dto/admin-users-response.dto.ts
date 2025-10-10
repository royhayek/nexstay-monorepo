import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { UserDataDto } from './user-response.dto';
import { BaseResponseDto } from '../../../common/dto/base-response.dto';
import { PaginatedDto } from '../../../common/dto/paginated.dto';

// Create a concrete paginated DTO for users to ensure proper Swagger generation
export class UsersPaginatedDto extends PaginatedDto<UserDataDto> {
  @ApiProperty({ type: [UserDataDto], description: 'Array of user items' })
  @Type(() => UserDataDto)
  declare items: UserDataDto[];
}

export class AdminUsersListResponseDto extends BaseResponseDto<UsersPaginatedDto> {
  @ApiProperty({
    description: 'Paginated users list data',
    type: UsersPaginatedDto,
  })
  declare data: UsersPaginatedDto;
}
