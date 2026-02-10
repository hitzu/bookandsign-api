import type { FactorizedAttrs } from '@jorgebodega/typeorm-factory';
import { Factory } from '@jorgebodega/typeorm-factory';
import type { DataSource } from 'typeorm';

import { ContractPreparationProfile } from '../../../src/contracts/entities/contract-preparation-profile.entity';
import { ContractFactory } from './contract.factory';

export class ContractPreparationProfileFactory extends Factory<ContractPreparationProfile> {
  protected entity = ContractPreparationProfile;
  protected dataSource: DataSource;

  constructor(dataSource: DataSource) {
    super();
    this.dataSource = dataSource;
  }

  protected attrs(): FactorizedAttrs<ContractPreparationProfile> {
    return {
      answers: {},
      locked: {},
    };
  }

  async create(
    attrs?: Partial<ContractPreparationProfile>,
  ): Promise<ContractPreparationProfile> {
    const profile = await this.make({ ...attrs });
    if (profile.contractId == null) {
      const contractFactory = new ContractFactory(this.dataSource);
      const contract = await contractFactory.create();
      profile.contractId = contract.id;
      profile.contract = contract;
    }
    return this.dataSource
      .getRepository(ContractPreparationProfile)
      .save(profile);
  }
}

