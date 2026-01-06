import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';

import { BaseTimeEntity } from '../../common/entities/base-time.entity';
import { Contract } from './contract.entity';
import { Package } from '../../packages/entities/package.entity';
import { CONTRACT_PACKAGE_SOURCE } from '../types/contract-package-source.types';

@Entity('contract_packages')
export class ContractPackage extends BaseTimeEntity {
  @Column('integer', { name: 'contract_id' })
  contractId!: number;

  @Column('integer', { name: 'package_id' })
  packageId!: number;

  @Column('integer', { default: 1 })
  quantity: number = 1;

  @Column('enum', {
    enum: CONTRACT_PACKAGE_SOURCE,
    default: CONTRACT_PACKAGE_SOURCE.PACKAGE,
  })
  source: CONTRACT_PACKAGE_SOURCE = CONTRACT_PACKAGE_SOURCE.PACKAGE;

  @ManyToOne(() => Contract, (contract) => contract.items, { nullable: false })
  @JoinColumn({ name: 'contract_id' })
  contract!: Contract;

  @ManyToOne(() => Package, { nullable: true })
  @JoinColumn({ name: 'package_id' })
  package?: Package | null;
}
