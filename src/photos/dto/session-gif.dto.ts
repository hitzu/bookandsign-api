import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsString, IsUUID } from 'class-validator';

export class PresignedGifUploadDto {
  @ApiProperty({ description: 'Session UUID', example: 'b5f4a6e2-3c1d-4f8a-9b1e-1a2b3c4d5e6f' })
  @IsUUID('4')
  sessionToken!: string;

  @ApiProperty({
    type: String,
    enum: ['local', 'prod'],
    description: 'Storage bucket environment',
    example: 'prod',
  })
  @IsIn(['local', 'prod'])
  storageEnv!: string;
}

export class PresignedGifUploadResponseDto {
  @ApiProperty({ description: 'Signed URL to PUT the GIF directly to Supabase' })
  presignedUrl!: string;

  @ApiProperty({ description: 'Storage path (for reference)' })
  gifPath!: string;

  @ApiProperty({ description: 'Public URL for guest consumption once the GIF is uploaded' })
  gifUrl!: string;
}

export class ConfirmGifDto {
  @ApiProperty({ description: 'Session UUID', example: 'b5f4a6e2-3c1d-4f8a-9b1e-1a2b3c4d5e6f' })
  @IsUUID('4')
  sessionToken!: string;

  @ApiPropertyOptional({
    description: 'Storage path returned by the presigned endpoint',
    example: 'photobooth/42/gifs/b5f4a6e2-3c1d-4f8a-9b1e-1a2b3c4d5e6f.gif',
  })
  @IsString()
  gifPath!: string;
}
