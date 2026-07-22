import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsUUID } from 'class-validator';

export class PresignedUploadDto {
  @ApiProperty({ description: 'Session UUID created by photobooth', example: 'b5f4a6e2-3c1d-4f8a-9b1e-1a2b3c4d5e6f' })
  @IsUUID('4')
  sessionToken!: string;

  @ApiPropertyOptional({ description: 'token UUID', example: 'b5f4a6e2-3c1d-4f8a-9b1e-1a2b3c4d5e6f' })
  @IsOptional()
  @IsUUID('4')
  eventToken?: string;

  @ApiProperty({
    description: 'Mime type for the asset being uploaded',
    enum: ['image/jpeg'],
    example: 'image/jpeg',
  })
  @IsIn(['image/jpeg'])
  mime!: string;
}

export class PresignedUploadVariantDto {
  @ApiProperty({ description: 'Signed URL to PUT the photo directly to Supabase' })
  presignedUrl!: string;

  @ApiProperty({ description: 'Storage path (for reference)' })
  photoPath!: string;
}

export class PresignedUploadResponseDto {
  @ApiProperty({ description: 'Photo ID — use this in POST /photos/confirm' })
  photoId!: number;

  @ApiProperty({ type: PresignedUploadVariantDto })
  original!: PresignedUploadVariantDto;

  @ApiProperty({ type: PresignedUploadVariantDto })
  minimized!: PresignedUploadVariantDto;
}
