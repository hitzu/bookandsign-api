import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator';

export class GetCarouselsQueryDto {
  @ApiProperty({ example: 'expo-bebe', description: 'Page identifier' })
  @IsString()
  @IsNotEmpty()
  page!: string;

  @ApiProperty({ example: 'services', description: 'Section identifier' })
  @IsString()
  @IsNotEmpty()
  section!: string;

  @ApiPropertyOptional({ type: Number, example: 1, description: 'Brand ID' })
  @IsOptional()
  @Matches(/^\d+$/, { message: 'brandId must be a positive integer' })
  brandId?: string;
}
