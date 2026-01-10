import { IsEnum, Matches } from 'class-validator';
import { SLOT_PERIOD } from '../constants/slot_period.enum';

export class HoldSlotDto {
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'eventDate must be in YYYY-MM-DD format',
  })
  eventDate!: string;

  @IsEnum(SLOT_PERIOD)
  period!: SLOT_PERIOD;
}
