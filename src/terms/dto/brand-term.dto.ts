import { Expose, Type } from 'class-transformer';
import { IsNumber } from 'class-validator';
import { BrandDto } from '../../brands/dto/brand.dto';

export class BrandTermDto {
  @Expose()
  @IsNumber()
  id!: number;

  @Expose()
  @IsNumber()
  brandId!: number;

  @Expose()
  @IsNumber()
  termId!: number;

  @Expose()
  @Type(() => BrandDto)
  brand!: BrandDto;
}
