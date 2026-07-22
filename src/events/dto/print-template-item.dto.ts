import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class PrintTemplateItemDto {
  @Expose()
  @ApiProperty({ example: 300 })
  @IsNumber()
  @IsOptional()
  dpi?: number;

  @Expose()
  @ApiProperty({ example: 'polaroid' })
  @IsString()
  type!: string;

  @Expose()
  @ApiProperty({ example: 'polaroid_2' })
  @IsString()
  template!: string;

  @Expose()
  @ApiProperty({ example: 'cake' })
  @IsString()
  @IsOptional()
  icon: string;

  @Expose()
  @ApiProperty({ example: 'yellow' })
  @IsString()
  @IsOptional()
  border: string;

  @Expose()
  @ApiProperty({ example: 'brillipoint_letrero_black' })
  @IsString()
  @IsOptional()
  logo: string;

  @Expose()
  @ApiProperty({ example: '6x4' })
  @IsString()
  @IsOptional()
  print_format?: string;

  @Expose()
  @ApiProperty({ example: 6 })
  @IsNumber()
  @IsOptional()
  paper_width_in?: number;

  @Expose()
  @ApiProperty({ example: 4 })
  @IsNumber()
  @IsOptional()
  paper_height_in?: number;
}
