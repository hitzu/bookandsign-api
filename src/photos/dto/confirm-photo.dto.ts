import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min } from 'class-validator';

export class ConfirmPhotoDto {
  @ApiProperty({ description: 'Photo ID returned by POST /photos/presigned', example: 42 })
  @IsInt()
  @Min(1)
  photoId!: number;
}
