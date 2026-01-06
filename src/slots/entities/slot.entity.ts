import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';

import { BaseTimeEntity } from '../../common/entities/base-time.entity';
import { Contract } from '../../contracts/entities/contract.entity';
import { SLOT_PERIOD } from '../types/slot-period.types';
import { SLOT_STATUS } from '../types/slot-status.types';
import { User } from '../../users/entities/user.entity';
import { SlotDto } from '../dto/slot.dto';
import { UseDto } from '../../common/dto/use-dto.decorator';

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

  @Column('enum', { enum: SLOT_STATUS, default: SLOT_STATUS.HELD })
  status: SLOT_STATUS = SLOT_STATUS.HELD;

  @Column('integer', { name: 'author_id' })
  authorId!: number;

  @Column('integer', { name: 'contract_id', nullable: true })
  contractId: number | null = null;

  @Column('text', { name: 'lead_name' })
  leadName!: string;

  @Column('text', { name: 'lead_email', nullable: true })
  leadEmail: string | null = null;

  @Column('text', { name: 'lead_phone', nullable: true })
  leadPhone: string | null = null;

  @ManyToOne(() => User, (user) => user.slots)
  @JoinColumn({ name: 'author_id' })
  user!: User;

  @ManyToOne(() => Contract, (contract) => contract.slots, {
    nullable: true,
    createForeignKeyConstraints: false,
  })
  @JoinColumn({ name: 'contract_id' })
  contract?: Contract | null;
}
