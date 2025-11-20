<<<<<<< HEAD
import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
=======
import { IsEnum, IsNumber, IsString } from 'class-validator';
>>>>>>> 9278f96 (feat: products functionality created)
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
  price!: number;

  @IsNumber()
  @IsOptional()
  discountPercentage: number | null = null;

  @IsEnum(PRODUCT_STATUS)
  status: PRODUCT_STATUS = PRODUCT_STATUS.DRAFT;

  @IsNumber()
  brandId!: number;
}
