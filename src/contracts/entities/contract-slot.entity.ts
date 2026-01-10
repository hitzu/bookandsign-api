import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToOne,
} from 'typeorm';

import { BaseTimeEntity } from '../../common/entities/base-time.entity';
import { Contract } from './contract.entity';
import { Slot } from '../../slots/entities/slot.entity';
import { CONTRACT_SLOT_PURPOSE } from '../constants/slot_purpose.enum';

@Entity('contract_slots')
@Index(['contractId'])
export class ContractSlot extends BaseTimeEntity {
  @Column('integer', { name: 'contract_id' })
  contractId!: number;

  @Column('integer', { name: 'slot_id' })
  slotId!: number;

  @Column('enum', {
    enum: CONTRACT_SLOT_PURPOSE,
    default: CONTRACT_SLOT_PURPOSE.EVENT,
  })
  purpose: CONTRACT_SLOT_PURPOSE = CONTRACT_SLOT_PURPOSE.EVENT;

  @ManyToOne(() => Contract, (contract) => contract.contractSlots, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'contract_id' })
  contract?: Contract | null;

  @OneToOne(() => Slot, (slot) => slot.contractSlot, { nullable: false })
  @JoinColumn({ name: 'slot_id' })
  slot?: Slot | null;
}
