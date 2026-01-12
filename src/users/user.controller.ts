import { Controller, Get, Query, ValidationPipe } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';

import { USER_ROLE } from './constants/user_role.enum';
import { GetUsersDto } from './dto/getUsers.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { UserService } from './user.service';

@Controller('users')
@ApiTags('users')
@ApiBearerAuth('access-token')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @ApiOperation({ summary: 'List users' })
  @ApiQuery({
    name: 'role',
    required: false,
    enum: USER_ROLE,
    description: 'Filter by user role',
  })
  @ApiOkResponse({
    description: 'Users list',
    type: UserResponseDto,
    isArray: true,
  })
  getUsers(
    @Query(new ValidationPipe({ transform: true, whitelist: true }))
    query: GetUsersDto,
  ): Promise<UserResponseDto[]> {
    return this.userService.getUsers(query);
  }
}
