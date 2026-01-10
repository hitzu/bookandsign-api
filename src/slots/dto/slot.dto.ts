import { Expose } from 'class-transformer';
import { IsEnum, IsNumber } from 'class-validator';

import { SLOT_PERIOD } from '../types/slot-period.types';
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
}
