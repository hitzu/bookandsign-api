import { Column, Entity, Index, JoinColumn, OneToOne } from 'typeorm';

import { BaseTimeEntity } from '../../common/entities/base-time.entity';
import { UseDto } from '../../common/dto/use-dto.decorator';
import { Contract } from '../../contracts/entities/contract.entity';
import { EventResponseDto } from '../dto/event-response.dto';

@Entity('events')
@UseDto(EventResponseDto)
@Index('UQ_events_token', ['token'], { unique: true })
@Index('UQ_events_key', ['key'], { unique: true })
export class Event extends BaseTimeEntity {
  @Column('varchar', { length: 255 })
  name!: string;

  @Column('varchar', { length: 255, unique: true })
  key!: string;

  @Column('text', { nullable: true })
  description!: string | null;

  @Column('uuid', { unique: true })
  token!: string;

  @Column('integer', { name: 'contract_id' })
  contractId!: number;

  @OneToOne(() => Contract, (contract) => contract.event, { nullable: true })
  @JoinColumn({ name: 'contract_id' })
  contract?: Contract | null;
}
