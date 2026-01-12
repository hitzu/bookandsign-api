import { IsNumber, IsOptional } from 'class-validator';

export class AddItemDto {
  @IsNumber()
  packageId!: number;

  @IsNumber()
  quantity!: number;

  @IsNumber()
  @IsOptional()
  promotionId?: number;
}
