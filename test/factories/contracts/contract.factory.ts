import type { FactorizedAttrs } from '@jorgebodega/typeorm-factory';
import { Factory } from '@jorgebodega/typeorm-factory';
import { faker } from '@faker-js/faker';
import type { DataSource } from 'typeorm';

import { Contract } from '../../../src/contracts/entities/contract.entity';
import { CONTRACT_STATUS } from '../../../src/contracts/types/contract-status.types';

export class ContractFactory extends Factory<Contract> {
  protected entity = Contract;
  protected dataSource: DataSource;

  constructor(dataSource: DataSource) {
    super();
    this.dataSource = dataSource;
  }

  protected attrs(): FactorizedAttrs<Contract> {
    return {
      status: CONTRACT_STATUS.PENDING,
      totalAmount: 0,
      token: faker.string.alphanumeric(100),
    };
  }

  async create(attrs?: Partial<Contract>): Promise<Contract> {
    const contract = await this.make({ ...attrs });
    return this.dataSource.getRepository(Contract).save(contract);
  }
}
