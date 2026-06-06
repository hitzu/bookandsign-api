import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';

import { BaseTimeEntity } from '../../common/entities/base-time.entity';
import { Extra } from '../../extras/entities/extra.entity';
import { Promotion } from '../../promotions/entities/promotion.entity';
import { Contract } from './contract.entity';

@Entity('contract_extras')
export class ContractExtra extends BaseTimeEntity {
  @Column('integer', { name: 'contract_id' })
  contractId!: number;

  @Column('integer', { name: 'extra_id' })
  extraId!: number;

  @Column('integer', { name: 'promotion_id', nullable: true })
  promotionId: number | null = null;

  @Column('text', { name: 'name_snapshot' })
  nameSnapshot!: string;

  @Column('decimal', {
    name: 'base_price_snapshot',
    transformer: {
      to: (value: number) => value,
      from: (value: string) => Number(value),
    },
  })
  basePriceSnapshot!: number;

  @Column('integer', { default: 1 })
  quantity: number = 1;

  @ManyToOne(() => Contract, (contract) => contract.extras, { nullable: false })
  @JoinColumn({ name: 'contract_id' })
  contract!: Contract;

  @ManyToOne(() => Extra, { nullable: true })
  @JoinColumn({ name: 'extra_id' })
  extra?: Extra | null;

  @ManyToOne(() => Promotion, { nullable: true })
  @JoinColumn({ name: 'promotion_id' })
  promotion?: Promotion | null;
}
