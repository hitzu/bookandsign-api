import { IsNumber } from 'class-validator';

export class AddPackageTermDto {
  @IsNumber()
  packageId!: number;

  @IsNumber()
  termId!: number;
}
