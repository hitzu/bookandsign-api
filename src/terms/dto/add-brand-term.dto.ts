import { IsNumber } from 'class-validator';

export class AddBrandTermDto {
  @IsNumber()
  brandId!: number;

  @IsNumber()
  termId!: number;
}
