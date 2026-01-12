import type { FactorizedAttrs } from '@jorgebodega/typeorm-factory';
import { Factory } from '@jorgebodega/typeorm-factory';
import { faker } from '@faker-js/faker';
import type { DataSource } from 'typeorm';

import { Contract } from '../../../src/contracts/entities/contract.entity';
import { CONTRACT_STATUS } from '../../../src/contracts/types/contract-status.types';
import { UserFactory } from '../user/user.factory';

export class ContractFactory extends Factory<Contract> {
  protected entity = Contract;
  protected dataSource: DataSource;

  constructor(dataSource: DataSource) {
    super();
    this.dataSource = dataSource;
  }

  protected attrs(): FactorizedAttrs<Contract> {
    return {
      sku: faker.string.alphanumeric(12),
      token: faker.string.uuid(),
      status: CONTRACT_STATUS.CONFIRMED,
      subtotal: null,
      discountTotal: null,
      total: null,
    };
  }

  async create(attrs?: Partial<Contract>): Promise<Contract> {
    const contract = await this.make({ ...attrs });
    if (contract.userId == null) {
      const userFactory = new UserFactory(this.dataSource);
      const user = await userFactory.create();
      contract.userId = user.id;
      contract.user = user;
    }
    return this.dataSource.getRepository(Contract).save(contract);
  }
}
