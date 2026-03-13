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
  name!: string;

  @IsNumber()
  @IsOptional()
  basePrice: number | null = null;

  @IsEnum(PACKAGE_STATUS)
  @IsOptional()
  status?: PACKAGE_STATUS;
}
