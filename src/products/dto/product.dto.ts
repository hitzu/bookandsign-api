import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { PRODUCT_STATUS } from '../types/products-status.types';
import { Expose, Type } from 'class-transformer';
import { BrandDto } from '../../brands/dto/brand.dto';

export class ProductDto {
  @Expose()
  @IsNumber()
  id!: number;

  @Expose()
  @IsString()
  name!: string;

  @Expose()
  @IsString()
  description: string | null;

  @Expose()
  @IsString()
  imageUrl: string | null;

  @Expose()
  @IsNumber()
  price!: number;

  @Expose()
  @IsNumber()
  discountPercentage: number | null;

  @Expose()
  @IsEnum(PRODUCT_STATUS)
  status!: PRODUCT_STATUS;

  @Expose()
  @IsNumber()
  brandId!: number;

  @Expose()
  @IsBoolean()
  isPromotional!: boolean;

  @Expose()
  @IsString()
  @IsOptional()
  promotionalText?: string | null = null;

  @Expose()
  @Type(() => BrandDto)
  brand: BrandDto | null;
}
