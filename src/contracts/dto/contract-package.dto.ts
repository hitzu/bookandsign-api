import { Expose, Type } from 'class-transformer';
import { IsNumber, IsString } from 'class-validator';
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
  @IsString()
  nameSnapshot!: string;

  @Expose()
  @IsNumber()
  basePriceSnapshot!: number;

  @Expose()
  @Type(() => PackageResponseDto)
  package!: PackageResponseDto;
}
