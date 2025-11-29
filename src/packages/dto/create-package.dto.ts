import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { PACKAGE_STATUS } from '../types/packages-status.types';

export class CreatePackageDto {
  @IsNumber()
  @IsNotEmpty()
  brandId!: number;

  @IsString()
  @IsNotEmpty()
  code!: string;

  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsOptional()
  description: string | null = null;

  @IsNumber()
  @IsOptional()
  basePrice: number | null = null;

  @IsNumber()
  @IsOptional()
  discount: number | null = null;

  @IsEnum(PACKAGE_STATUS)
  status!: PACKAGE_STATUS;
}
