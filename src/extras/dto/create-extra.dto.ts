import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

import { EXTRA_STATUS } from '../types/extras-status.types';

export class CreateExtraDto {
  @IsNumber()
  @IsNotEmpty()
  brandId!: number;

  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsOptional()
  description?: string | null;

  @IsNumber()
  @IsOptional()
  price: number | null = null;

  @IsEnum(EXTRA_STATUS)
  @IsOptional()
  status?: EXTRA_STATUS;
}
