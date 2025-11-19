import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsNotEmpty } from 'class-validator';

export class accessAndRefreshTokenDto {
  @IsNotEmpty()
  @Expose()
  @ApiProperty()
  accessToken: string;

  @IsNotEmpty()
  @Expose()
  @ApiProperty()
  refreshToken: string;
}

export class userInfo {
  @Expose()
  @ApiProperty()
  id: number;

  @Expose()
  @ApiProperty()
  email: string;

  @Expose()
  @ApiProperty()
  role: string;

  @Expose()
  @ApiProperty()
  firstName: string;

  @Expose()
  @ApiProperty()
  lastName: string;

  @Expose()
  @ApiProperty()
  phone: string;
}

export class LoginOutputDto {
  @Expose()
  @ApiProperty()
  accessAndRefreshToken: accessAndRefreshTokenDto;

  @Expose()
  @ApiProperty()
  userInfo: userInfo;
}
