import { IsEnum, IsNumber, IsString } from 'class-validator';
import { PRODUCT_STATUS } from '../types/products-status.types';

export class CreateProductDto {
  @IsString()
  name!: string;

  @IsString()
  description: string | null = null;

  @IsString()
  image_url: string | null = null;

  @IsNumber()
  price!: number;

  @IsNumber()
  discount_percentage: number | null = null;

  @IsEnum(PRODUCT_STATUS)
  status: PRODUCT_STATUS = PRODUCT_STATUS.DRAFT;
}
