import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsDate, IsIn, IsNumber, IsOptional, IsString } from 'class-validator';

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
  @ApiProperty({ type: String, nullable: true })
  @IsOptional()
  @IsString()
  publicUrl!: string | null;

  @Expose()
  @ApiProperty({ enum: ['processing', 'ready', 'error'] })
  @IsIn(['processing', 'ready', 'error'])
  status!: 'processing' | 'ready' | 'error';

  @Expose()
  @ApiProperty()
  @IsDate()
  consentAt!: Date;

  @Expose()
  @ApiProperty()
  createdAt!: Date;
}
