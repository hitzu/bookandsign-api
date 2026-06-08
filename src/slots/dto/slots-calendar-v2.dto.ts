import { Expose, Type } from 'class-transformer';
import {
  IsEmail,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  ValidateNested,
} from 'class-validator';

import { CONTRACT_STATUS } from '../../contracts/types/contract-status.types';
import { SlotsCalendarDaySlotsDto } from './slots-calendar.dto';

export class SlotsCalendarV2ContractInfoDto {
  @Expose()
  @IsNumber()
  id!: number;

  @Expose()
  @IsEnum(CONTRACT_STATUS)
  status!: CONTRACT_STATUS;

  @Expose()
  @IsOptional()
  @IsString()
  clientName?: string | null;

  @Expose()
  @IsOptional()
  @IsString()
  clientPhone?: string | null;

  @Expose()
  @IsOptional()
  @IsEmail()
  clientEmail?: string | null;

  @Expose()
  @IsString()
  sku!: string;

  @Expose()
  @IsOptional()
  @IsNumber()
  brandId?: number | null;
}

export class SlotsCalendarV2DayContractsDto {
  @Expose()
  @IsOptional()
  @ValidateNested()
  @Type(() => SlotsCalendarV2ContractInfoDto)
  morning!: SlotsCalendarV2ContractInfoDto | null;

  @Expose()
  @IsOptional()
  @ValidateNested()
  @Type(() => SlotsCalendarV2ContractInfoDto)
  afternoon!: SlotsCalendarV2ContractInfoDto | null;
}

export class SlotsCalendarV2DayDto {
  @Expose()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'date must be in YYYY-MM-DD format',
  })
  date!: string;

  @Expose()
  @ValidateNested()
  @Type(() => SlotsCalendarDaySlotsDto)
  slots!: SlotsCalendarDaySlotsDto;

  @Expose()
  @IsOptional()
  @ValidateNested()
  @Type(() => SlotsCalendarV2DayContractsDto)
  contracts?: SlotsCalendarV2DayContractsDto;
}
