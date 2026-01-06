import { Expose } from 'class-transformer';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { AbstractDto } from '../../common/dto/abstract.dto';
import { SLOT_PERIOD } from '../types/slot-period.types';
import { SLOT_STATUS } from '../types/slot-status.types';

export class SlotAvailabilitySlotDto extends AbstractDto {
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
  leadEmail: string | null = null;

  @Expose()
  @IsOptional()
  @IsString()
  leadPhone: string | null = null;

  @Expose()
  @IsOptional()
  @IsNumber()
  contractId: number | null = null;
}

export class SlotAvailabilityDto extends AbstractDto {
  @Expose()
  @IsEnum(SLOT_PERIOD)
  period!: SLOT_PERIOD;

  @Expose()
  @IsBoolean()
  available!: boolean;

  @Expose()
  @IsOptional()
  @Type(() => SlotAvailabilitySlotDto)
  slot?: SlotAvailabilitySlotDto | null;

  @Expose()
  @IsNumber()
  id!: number;

  @Expose()
  @IsString()
  eventDate!: string;

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
}
