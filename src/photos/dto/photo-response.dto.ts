import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsDate, IsNumber, IsString } from 'class-validator';

export class PhotoResponseDto {
  @Expose()
  @ApiProperty()
  @IsNumber()
  id!: number;

  @Expose()
  @ApiProperty()
  @IsString()
  storagePath!: string;

  @Expose()
  @ApiProperty()
  @IsString()
  publicUrl!: string;

  @Expose()
  @ApiProperty()
  @IsDate()
  consentAt!: Date;

  @Expose()
  @ApiProperty()
  createdAt!: Date;
}
