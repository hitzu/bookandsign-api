import { Column, Entity, Index, OneToOne } from 'typeorm';

import { BaseTimeEntity } from '../../common/entities/base-time.entity';
import { SlotDto } from '../dto/slot.dto';
import { UseDto } from '../../common/dto/use-dto.decorator';
import { SLOT_PERIOD } from '../constants/slot_period.enum';
import { SLOT_STATUS } from '../constants/slot_status.enum';
import { ContractSlot } from '../../contracts/entities/contract-slot.entity';

@Entity('slots')
@Index(['eventDate', 'period'], {
  unique: true,
  where: '"deleted_at" IS NULL',
})
@UseDto(SlotDto)
export class Slot extends BaseTimeEntity {
  @Column('date', { name: 'event_date' })
  eventDate!: string;

  @Column('enum', { enum: SLOT_PERIOD })
  period!: SLOT_PERIOD;

  @Column('enum', { enum: SLOT_STATUS, default: SLOT_STATUS.AVAILABLE })
  status: SLOT_STATUS = SLOT_STATUS.AVAILABLE;

  /**
   * Inverse side of the key relationship: a Slot can be attached to only one Contract via `contract_slots`.
   */
  @OneToOne(() => ContractSlot, (contractSlot) => contractSlot.slot)
  contractSlot?: ContractSlot;
}
