import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsString } from 'class-validator';

export class CreatePersonalizedUploadUrlDto {
  @ApiProperty({
    type: String,
    description: 'Original file name from the editor export',
    example: 'photo_customized_2026-03-28T12-30-00.jpg',
  })
  @IsString()
  fileName!: string;

  @ApiProperty({
    type: String,
    enum: ['image/jpeg'],
    description: 'Mime type allowed for direct upload',
    example: 'image/jpeg',
  })
  @IsIn(['image/jpeg'])
  mime!: string;

  @ApiProperty({
    type: String,
    enum: ['local', 'prod'],
    description: 'Storage path environment prefix',
    example: 'prod',
  })
  @IsIn(['local', 'prod'])
  storageEnv!: string;
}
