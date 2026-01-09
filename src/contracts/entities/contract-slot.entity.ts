import { Column, Entity, Index, JoinColumn, ManyToOne, OneToOne } from 'typeorm';

import { BaseTimeEntity } from '../../common/entities/base-time.entity';
import { Contract } from './contract.entity';
import { Slot } from '../../slots/entities/slot.entity';

export enum CONTRACT_SLOT_PURPOSE {
  EVENT = 'event',
  TRIAL_MAKEUP = 'trial_makeup',
  TRIAL_HAIR = 'trial_hair',
  OTHER = 'other',
}

@Entity('contract_slots')
@Index(['slotId'], { unique: true, where: '"deleted_at" IS NULL' })
@Index(['contractId'])
export class ContractSlot extends BaseTimeEntity {
  @Column('integer', { name: 'contract_id' })
  contractId!: number;

  @Column('integer', { name: 'slot_id' })
  slotId!: number;

  /**
   * Key relationship: a Contract can have multiple Slots, but a reserved Slot can belong to only one Contract.
   */
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
  contract!: Contract;

  @OneToOne(() => Slot, (slot) => slot.contractSlot, { nullable: false })
  @JoinColumn({ name: 'slot_id' })
  slot!: Slot;
}

