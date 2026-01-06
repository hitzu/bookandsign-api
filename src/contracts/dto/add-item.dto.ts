import { IsEnum, IsNumber, IsOptional } from 'class-validator';

import { CONTRACT_PACKAGE_SOURCE } from '../types/contract-package-source.types';

export class AddItemDto {
  @IsNumber()
  packageId!: number;

  @IsNumber()
  quantity!: number;

  @IsEnum(CONTRACT_PACKAGE_SOURCE)
  @IsOptional()
  source?: CONTRACT_PACKAGE_SOURCE;
}
