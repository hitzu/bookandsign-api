import {
  IsEmail,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { SLOT_PERIOD } from '../types/slot-period.types';
import { Expose } from 'class-transformer';
import { SLOT_STATUS } from '../types/slot-status.types';

export class SlotDto {
  @Expose()
  @IsNumber()
  id!: number;

  @Expose()
  eventDate!: string;

  @Expose()
  @IsEnum(SLOT_PERIOD)
  period!: SLOT_PERIOD;

  @Expose()
  @IsEnum(SLOT_STATUS)
  status!: SLOT_STATUS;

  @Expose()
  @IsNumber()
  authorId!: number;

  @Expose()
  @IsString()
  leadName!: string;

  @Expose()
  @IsEmail()
  @IsOptional()
  leadEmail: string | null = null;

  @Expose()
  @IsString()
  @IsOptional()
  leadPhone: string | null = null;

  @Expose()
  @IsNumber()
  contractId!: number | null;
}
