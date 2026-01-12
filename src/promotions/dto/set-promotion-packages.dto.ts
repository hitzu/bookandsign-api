import { IsArray, IsNumber } from 'class-validator';

export class SetPromotionPackagesDto {
  @IsArray()
  @IsNumber({}, { each: true })
  packageIds!: number[];
}

