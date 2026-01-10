import { Expose, Type } from 'class-transformer';
import { IsEnum, Matches, ValidateNested } from 'class-validator';

import { SLOT_STATUS } from '../types/slot-status.types';

export class SlotsCalendarDaySlotsDto {
  @Expose()
  @IsEnum(SLOT_STATUS)
  morning!: SLOT_STATUS;

  @Expose()
  @IsEnum(SLOT_STATUS)
  afternoon!: SLOT_STATUS;
}

export class SlotsCalendarDto {
  @Expose()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'date must be in YYYY-MM-DD format',
  })
  date!: string;

  @Expose()
  @ValidateNested()
  @Type(() => SlotsCalendarDaySlotsDto)
  slots!: SlotsCalendarDaySlotsDto;
}
