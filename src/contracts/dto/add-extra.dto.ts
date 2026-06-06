import { IsNumber, IsOptional } from 'class-validator';

export class AddExtraDto {
  @IsNumber()
  extraId!: number;

  @IsNumber()
  quantity!: number;

  @IsNumber()
  @IsOptional()
  promotionId?: number;

  @IsNumber()
  @IsOptional()
  basePriceSnapshot?: number;
}
