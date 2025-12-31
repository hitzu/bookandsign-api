import { Expose, Type } from 'class-transformer';
import { BrandDto } from '../../brands/dto/brand.dto';
import { PackageProductsDto } from './package-products.dto';
import { IsEnum, IsNumber, IsString } from 'class-validator';
import { PACKAGE_STATUS } from '../types/packages-status.types';

export class PackageResponseDto {
  @Expose()
  @IsNumber()
  id!: number;

  @Expose()
  @IsString()
  code!: string;

  @Expose()
  @IsString()
  name!: string;

  @Expose()
  @IsString()
  description: string | null = null;

  @Expose()
  @IsNumber()
  basePrice: number | null = null;

  @Expose()
  @IsNumber()
  discount: number | null = null;

  @Expose()
  @IsEnum(PACKAGE_STATUS)
  status!: PACKAGE_STATUS;

  @Expose()
  @IsNumber()
  brandId!: number;

  @Expose()
  @Type(() => BrandDto)
  brand!: BrandDto;

  @Expose()
  @Type(() => PackageProductsDto)
  packageProducts!: PackageProductsDto[];
}
