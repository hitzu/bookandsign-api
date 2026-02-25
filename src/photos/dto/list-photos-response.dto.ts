import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { PhotoResponseDto } from './photo-response.dto';

export class ListPhotosResponseDto {
  @ApiProperty({ type: PhotoResponseDto, isArray: true })
  @ValidateNested({ each: true })
  @Type(() => PhotoResponseDto)
  items!: PhotoResponseDto[];

  @ApiProperty({ type: Boolean, description: 'Indicates if more photos are available' })
  @IsBoolean()
  hasMore!: boolean;

  @ApiProperty({
    type: String,
    nullable: true,
    description: 'Cursor to request the next page; null when there are no more photos',
  })
  @IsOptional()
  @IsString()
  nextCursor!: string | null;
}
