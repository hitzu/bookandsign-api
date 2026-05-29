import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsOptional, IsString } from 'class-validator';

export class PrintTemplateItemDto {
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
}
