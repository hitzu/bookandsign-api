import { Expose, Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { SLOT_PERIOD } from '../types/slot-period.types';
import { SLOT_STATUS } from '../types/slot-status.types';

export class SlotAvailabilitySlotDto {
  @Expose()
  @IsNumber()
  id!: number;

  @Expose()
  @IsEnum(SLOT_STATUS)
  status!: SLOT_STATUS;

  @Expose()
  @IsString()
  leadName!: string;

  @Expose()
  @IsOptional()
  @IsString()
  leadEmail!: string | null;

  @Expose()
  @IsOptional()
  @IsString()
  leadPhone!: string | null;

  @Expose()
  @IsOptional()
  @IsNumber()
  contractId!: number | null;
}

export class SlotAvailabilityDto {
  @Expose()
  @IsEnum(SLOT_PERIOD)
  period!: SLOT_PERIOD;

  @Expose()
  @IsBoolean()
  available!: boolean;

  @Expose()
  @IsOptional()
  @Type(() => SlotAvailabilitySlotDto)
  slot!: SlotAvailabilitySlotDto | null;
}
