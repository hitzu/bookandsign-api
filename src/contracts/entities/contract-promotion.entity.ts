import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';

import { BaseTimeEntity } from '../../common/entities/base-time.entity';
import { Promotion } from '../../promotions/entities/promotion.entity';
import { Contract } from './contract.entity';

@Entity('contract_promotions')
export class ContractPromotion extends BaseTimeEntity {
  @Column('integer', { name: 'contract_id' })
  contractId!: number;

  @Column('integer', { name: 'promotion_id', nullable: true })
  promotionId: number | null = null;

  /**
   * Snapshot fields: these represent the promotion state applied at the moment of contracting.
   */
  @Column('text', { name: 'name_snapshot' })
  nameSnapshot!: string;

  @Column('text', { name: 'type_snapshot' })
  typeSnapshot!: string;

  @Column('decimal', {
    name: 'value_snapshot',
    transformer: {
      to: (value: number) => value,
      from: (value: string) => Number(value),
    },
  })
  valueSnapshot!: number;

  @Column('decimal', {
    name: 'applied_amount',
    transformer: {
      to: (value: number) => value,
      from: (value: string) => Number(value),
    },
  })
  appliedAmount!: number;

  @ManyToOne(() => Contract, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'contract_id' })
  contract!: Contract;

  @ManyToOne(() => Promotion, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'promotion_id' })
  promotion?: Promotion | null;
}

