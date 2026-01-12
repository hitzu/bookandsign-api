import { IsDate, IsEnum, IsNumber, IsString } from 'class-validator';
import { Expose, Type } from 'class-transformer';
import { BrandDto } from '../../brands/dto/brand.dto';
import { PROMOTIONAL_TYPE } from '../constants/promotional_type.enum';

export class ProductDto {
  @Expose()
  @IsNumber()
  id!: number;

  @Expose()
  @IsString()
  name!: string;

  @Expose()
  @IsNumber()
  brandId!: number;

  @Expose()
  @IsEnum(PROMOTIONAL_TYPE)
  promotionalType!: PROMOTIONAL_TYPE;

  @Expose()
  @Type(() => BrandDto)
  brand: BrandDto | null;

  @Expose()
  @IsDate()
  createdAt!: Date;

  @Expose()
  @IsDate()
  updatedAt!: Date;
}
