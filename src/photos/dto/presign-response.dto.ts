import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsNumber, IsString } from 'class-validator';

export class PresignResponseDto {
  @Expose()
  @ApiProperty({ description: 'Resolved event ID' })
  @IsNumber()
  eventId!: number;

  @Expose()
  @ApiProperty({ description: 'Supabase storage bucket name' })
  @IsString()
  bucket!: string;

  @Expose()
  @ApiProperty({ description: 'Object path in storage' })
  @IsString()
  path!: string;

  @Expose()
  @ApiProperty({ description: 'Upload URL for direct upload' })
  @IsString()
  signedUrl!: string;

  @Expose()
  @ApiProperty({ description: 'Public URL after upload' })
  @IsString()
  publicUrl!: string;
}
