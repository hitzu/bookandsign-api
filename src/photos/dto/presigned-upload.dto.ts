import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsUUID, Min } from 'class-validator';

export class PresignedUploadDto {
  @ApiProperty({ description: 'Session UUID', example: 'b5f4a6e2-3c1d-4f8a-9b1e-1a2b3c4d5e6f' })
  @IsUUID('4')
  sessionToken!: string;
}

export class PresignedUploadResponseDto {
  @ApiProperty({ description: 'Photo ID — use this in POST /photos/confirm' })
  photoId!: number;

  @ApiProperty({ description: 'Signed URL to PUT the photo directly to Supabase' })
  presignedUrl!: string;

  @ApiProperty({ description: 'Storage path (for reference)' })
  photoPath!: string;
}
