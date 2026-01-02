import {
  IsEmail,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
} from 'class-validator';
import { SLOT_PERIOD } from '../types/slot-period.types';

export class HoldSlotDto {
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'eventDate must be in YYYY-MM-DD format',
  })
  eventDate!: string;

  @IsEnum(SLOT_PERIOD)
  period!: SLOT_PERIOD;

  @IsNumber()
  authorId!: number;

  @IsString()
  leadName!: string;

  @IsEmail()
  @IsOptional()
  leadEmail: string | null = null;

  @IsString()
  @IsOptional()
  leadPhone: string | null = null;
}
