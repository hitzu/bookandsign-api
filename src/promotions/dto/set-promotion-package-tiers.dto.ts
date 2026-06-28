import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsNumber,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

export class PromotionPackageTierInputDto {
  @IsInt()
  @Min(1)
  order!: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  discountPercentage!: number;
}

export class PromotionPackageTiersInputDto {
  @IsInt()
  packageId!: number;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => PromotionPackageTierInputDto)
  tiers!: PromotionPackageTierInputDto[];
}

export class SetPromotionPackageTiersDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PromotionPackageTiersInputDto)
  packages!: PromotionPackageTiersInputDto[];
}
