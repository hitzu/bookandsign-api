import { IsNumber } from 'class-validator';

export class RemovePackageTermDto {
  @IsNumber()
  packageId!: number;

  @IsNumber()
  termId!: number;
}

