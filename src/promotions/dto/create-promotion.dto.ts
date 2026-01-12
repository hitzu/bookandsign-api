import { Type } from 'class-transformer';
import {
  IsDate,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

import { PROMOTION_STATUS, PROMOTION_TYPE } from '../entities/promotion.entity';

export class CreatePromotionDto {
  @IsNumber()
  @IsNotEmpty()
  brandId!: number;

  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsEnum(PROMOTION_TYPE)
  type!: PROMOTION_TYPE;

  @IsNumber()
  value!: number;

  @IsEnum(PROMOTION_STATUS)
  @IsOptional()
  status?: PROMOTION_STATUS;

  @Type(() => Date)
  @IsDate()
  @IsOptional()
  validFrom?: Date | null;

  @Type(() => Date)
  @IsDate()
  @IsOptional()
  validUntil?: Date | null;
}
