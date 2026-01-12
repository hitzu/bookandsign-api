import { Expose, Type } from 'class-transformer';
import { IsEnum, IsNumber } from 'class-validator';
import { CONTRACT_SLOT_PURPOSE } from '../constants/slot_purpose.enum';
import { SlotDto } from 'src/slots/dto/slot.dto';

export class ContractSlotDto {
  @Expose()
  @IsNumber()
  id!: number;

  @Expose()
  @IsEnum(CONTRACT_SLOT_PURPOSE)
  purpose!: CONTRACT_SLOT_PURPOSE;

  @Expose()
  @IsNumber()
  slotId!: number;

  @Expose()
  @IsNumber()
  contractId!: number;

  @Expose()
  @Type(() => SlotDto)
  slot!: SlotDto;
}
