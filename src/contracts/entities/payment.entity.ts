import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';

import { BaseTimeEntity } from '../../common/entities/base-time.entity';
import { Contract } from './contract.entity';
import { PAYMENT_METHOD } from '../types/payment-method.types';

@Entity('payments')
export class Payment extends BaseTimeEntity {
  @Column('integer', { name: 'contract_id' })
  contractId!: number;

  @Column('float')
  amount!: number;

  @Column('enum', { enum: PAYMENT_METHOD })
  method!: PAYMENT_METHOD;

  @Column('timestamptz', { name: 'received_at' })
  receivedAt!: Date;

  @Column('text', { nullable: true })
  note: string | null = null;

  @ManyToOne(() => Contract, (contract) => contract.payments, {
    nullable: false,
  })
  @JoinColumn({ name: 'contract_id' })
  contract!: Contract;
}
