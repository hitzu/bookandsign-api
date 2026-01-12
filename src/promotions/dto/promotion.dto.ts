import { Expose } from 'class-transformer';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

import { PROMOTION_STATUS, PROMOTION_TYPE } from '../entities/promotion.entity';

export class PromotionDto {
  @Expose()
  @IsNumber()
  id!: number;

  @Expose()
  @IsNumber()
  @IsNotEmpty()
  brandId!: number;

  @Expose()
  @IsString()
  @IsNotEmpty()
  name!: string;

  @Expose()
  @IsEnum(PROMOTION_TYPE)
  type!: PROMOTION_TYPE;

  @Expose()
  @IsNumber()
  value!: number;

  @Expose()
  @IsEnum(PROMOTION_STATUS)
  @IsOptional()
  status?: PROMOTION_STATUS;
}
