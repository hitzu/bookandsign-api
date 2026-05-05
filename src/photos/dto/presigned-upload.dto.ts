import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsUUID } from 'class-validator';

export class PresignedUploadDto {
  @ApiProperty({ description: 'Session UUID', example: 'b5f4a6e2-3c1d-4f8a-9b1e-1a2b3c4d5e6f' })
  @IsUUID('4')
  sessionToken!: string;

  @ApiProperty({
    type: String,
    enum: ['local', 'prod'],
    description: 'Storage path environment prefix',
    example: 'prod',
  })
  @IsIn(['local', 'prod'])
  storageEnv!: string;

  @ApiProperty({
    description: 'Mime type for the asset being uploaded',
    enum: ['image/jpeg', 'image/gif'],
    example: 'image/jpeg',
  })
  @IsIn(['image/jpeg', 'image/gif'])
  mime!: string;
}

export class PresignedUploadResponseDto {
  @ApiProperty({ description: 'Photo ID — use this in POST /photos/confirm' })
  photoId!: number;

  @ApiProperty({ description: 'Signed URL to PUT the photo directly to Supabase' })
  presignedUrl!: string;

  @ApiProperty({ description: 'Storage path (for reference)' })
  photoPath!: string;
}
