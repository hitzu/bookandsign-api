import { IsNumber } from 'class-validator';

export class RemoveBrandTermDto {
  @IsNumber()
  brandId!: number;

  @IsNumber()
  termId!: number;
}
