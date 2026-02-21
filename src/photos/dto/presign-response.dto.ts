import { ApiProperty } from '@nestjs/swagger';

export class PresignResponseDto {
  @ApiProperty({ description: 'Upload URL for direct upload' })
  uploadUrl!: string;

  @ApiProperty({ description: 'Object key in storage' })
  objectKey!: string;

  @ApiProperty({ description: 'Public URL after upload' })
  publicUrl!: string;
}
