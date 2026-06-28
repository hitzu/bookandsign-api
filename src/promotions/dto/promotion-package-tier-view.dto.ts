import { Expose, Type } from 'class-transformer';
import { IsNumber, IsString } from 'class-validator';

export class PromotionPackageTierViewDto {
  @Expose()
  @IsNumber()
  order!: number;

  @Expose()
  @IsNumber()
  discountPercentage!: number;
}

export class PromotionPackageViewDto {
  @Expose()
  @IsNumber()
  packageId!: number;

  @Expose()
  @IsString()
  packageName!: string;

  @Expose()
  @Type(() => PromotionPackageTierViewDto)
  tiers!: PromotionPackageTierViewDto[];
}
