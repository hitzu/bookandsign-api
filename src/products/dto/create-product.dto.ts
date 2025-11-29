import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { PRODUCT_STATUS } from '../types/products-status.types';

export class CreateProductDto {
  @IsString()
  name!: string;

  @IsString()
  @IsOptional()
  description: string | null = null;

  @IsString()
  @IsOptional()
  imageUrl: string | null = null;

  @IsNumber()
  @IsOptional()
  price: number | null = null;

  @IsNumber()
  @IsOptional()
  discountPercentage: number | null = null;

  @IsEnum(PRODUCT_STATUS)
  status: PRODUCT_STATUS = PRODUCT_STATUS.DRAFT;

  @IsNumber()
  brandId!: number;
}
