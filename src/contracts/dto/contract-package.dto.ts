import { Expose, Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsNumber } from 'class-validator';

import { CONTRACT_PACKAGE_SOURCE } from '../types/contract-package-source.types';
import { PackageResponseDto } from '../../packages/dto/package-response.dto';

export class ContractPackageDto {
  @Expose()
  @IsNumber()
  id!: number;

  @Expose()
  @IsNumber()
  contractId!: number;

  @Expose()
  @IsNumber()
  packageId!: number;

  @Expose()
  @IsNumber()
  quantity!: number;

  @Expose()
  @IsNumber()
  unitPrice!: number;

  @Expose()
  @IsEnum(CONTRACT_PACKAGE_SOURCE)
  source!: CONTRACT_PACKAGE_SOURCE;

  @Expose()
  @IsBoolean()
  displayAsSaving!: boolean;

  @Expose()
  @Type(() => PackageResponseDto)
  package!: PackageResponseDto;
}
