import { Column, Entity, Index, JoinColumn, OneToOne } from 'typeorm';

import { BaseTimeEntity } from '../../common/entities/base-time.entity';
import { Contract } from './contract.entity';

export type ContractPreparationProfileAnswers = Record<string, unknown>;
export type ContractPreparationProfileLocked = Record<string, boolean>;

@Entity('contract_preparation_profiles')
export class ContractPreparationProfile extends BaseTimeEntity {
  @Index({ unique: true })
  @Column('integer', { name: 'contract_id' })
  contractId!: number;

  @Column('jsonb', { default: () => "'{}'::jsonb" })
  answers: ContractPreparationProfileAnswers = {};

  @Column('jsonb', { default: () => "'{}'::jsonb" })
  locked: ContractPreparationProfileLocked = {};

  @OneToOne(() => Contract, { nullable: false })
  @JoinColumn({ name: 'contract_id' })
  contract!: Contract;
}
