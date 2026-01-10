import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';

import { BaseTimeEntity } from '../../common/entities/base-time.entity';
import { Contract } from './contract.entity';
import { Package } from '../../packages/entities/package.entity';

@Entity('contract_packages')
export class ContractPackage extends BaseTimeEntity {
  @Column('integer', { name: 'contract_id' })
  contractId!: number;

  @Column('integer', { name: 'package_id' })
  packageId!: number;

  /**
   * Snapshot fields: these represent the package state at the moment the contract is created.
   */
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

  @ManyToOne(() => Contract, (contract) => contract.items, { nullable: false })
  @JoinColumn({ name: 'contract_id' })
  contract!: Contract;

  @ManyToOne(() => Package, { nullable: true })
  @JoinColumn({ name: 'package_id' })
  package?: Package | null;
}
