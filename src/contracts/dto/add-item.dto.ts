import { IsNumber } from 'class-validator';

export class AddItemDto {
  @IsNumber()
  packageId!: number;

  @IsNumber()
  quantity!: number;
}
