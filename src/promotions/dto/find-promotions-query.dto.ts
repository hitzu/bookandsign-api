import { IsEnum, IsOptional, IsString } from 'class-validator';

import { PROMOTION_STATUS } from '../entities/promotion.entity';

export class FindPromotionsQueryDto {
  @IsOptional()
  @IsString()
  brandId?: string;

  @IsOptional()
  @IsEnum(PROMOTION_STATUS)
  status?: PROMOTION_STATUS;
}

