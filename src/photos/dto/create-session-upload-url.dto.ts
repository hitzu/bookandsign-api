import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsString } from 'class-validator';

export class CreateSessionUploadUrlDto {
  @ApiProperty({
    type: String,
    description: 'Original file name from the cabin export',
    example: 'photo_2026-04-14T12-30-00.jpg',
  })
  @IsString()
  fileName!: string;

  @ApiProperty({
    type: String,
    enum: ['image/jpeg', 'image/png'],
    description: 'Mime type allowed for direct upload',
    example: 'image/jpeg',
  })
  @IsIn(['image/jpeg', 'image/png'])
  mime!: string;
}

export class SessionUploadUrlResponseDto {
  @ApiProperty({ description: 'Photo ID to use on confirm/fail' })
  photo_id!: number;

  @ApiProperty({ description: 'Presigned upload URL' })
  upload_url!: string;

  @ApiProperty({ description: 'Storage object path' })
  storage_path!: string;

  @ApiProperty({ description: 'Seconds until the URL expires' })
  expires_in!: number;
}
