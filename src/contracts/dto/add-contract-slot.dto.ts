import { IsEnum, IsNumber } from 'class-validator';
import { CONTRACT_SLOT_PURPOSE } from '../constants/slot_purpose.enum';

export class AddContractSlotDto {
  @IsNumber()
  slotId!: number;

  @IsEnum(CONTRACT_SLOT_PURPOSE)
  purpose!: CONTRACT_SLOT_PURPOSE;
}
