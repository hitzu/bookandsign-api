import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';

import { USER_ROLE } from '../constants/user_role.enum';

export class GetUsersDto {
  @ApiPropertyOptional({
    enum: USER_ROLE,
    description: 'Filter by user role',
  })
  @IsOptional()
  @IsEnum(USER_ROLE)
  role?: USER_ROLE;
}
