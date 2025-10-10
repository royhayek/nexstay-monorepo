import { plainToInstance } from 'class-transformer';
import { ApiTags } from '@nestjs/swagger';
import { PublicEndpoint } from '../../../common/decorators/api-endpoint.decorator';
import { Controller, Post, Body } from '@nestjs/common';
import { BaseController } from '../../../common/controllers/base.controller';
import { UsersFacadeService } from '../services/users-facade.service';
import { CreateUserDto } from '../dto/create-user.dto';
import { UserDataDto, UserResponseDto } from '../dto/user-response.dto';
import * as userSchema from '../../../database/schemas/user.schema';

/**
 * Public Controller for Users
 * Handles publicly accessible user-related operations
 */
@Controller('public/users')
@ApiTags('Users (Public)')
export class UsersPublicController extends BaseController {
  constructor(private readonly usersService: UsersFacadeService) {
    super();
  }

  @Post()
  @PublicEndpoint(
    'Create a new user account',
    'Register a new user account in the system',
    UserResponseDto,
  )
  async create(@Body() dto: CreateUserDto): Promise<UserResponseDto> {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        const user: userSchema.UserDocument = await this.usersService.create(dto);
        return plainToInstance(UserDataDto, user.toObject());
      },
      'User creation',
      'User Created',
      'User created successfully',
      'Failed to create user',
    );
  }
}
