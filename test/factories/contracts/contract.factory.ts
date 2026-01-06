import type { FactorizedAttrs } from '@jorgebodega/typeorm-factory';
import { Factory } from '@jorgebodega/typeorm-factory';
import { faker } from '@faker-js/faker';
import type { DataSource } from 'typeorm';

import { Contract } from '../../../src/contracts/entities/contract.entity';
import { CONTRACT_STATUS } from '../../../src/contracts/types/contract-status.types';
import { BrandFactory } from '../brands/brands.factories';
import type { Brand } from '../../../src/brands/entities/brand.entity';

export class ContractFactory extends Factory<Contract> {
  protected entity = Contract;
  protected dataSource: DataSource;

  constructor(dataSource: DataSource) {
    super();
    this.dataSource = dataSource;
  }

  protected attrs(): FactorizedAttrs<Contract> {
    return {
      brandId: 0,
      clientName: faker.person.fullName(),
      clientPhone: faker.phone.number(),
      clientEmail: faker.internet.email(),
      notes: faker.lorem.sentence(),
      status: CONTRACT_STATUS.PENDING,
      totalAmount: 0,
      tokenId: null,
    };
  }

  async createForBrand(brand: Brand, attrs?: Partial<Contract>): Promise<Contract> {
    const contract = await this.make({ brandId: brand.id, ...attrs });
    return this.dataSource.getRepository(Contract).save(contract);
  }

  async create(attrs?: Partial<Contract>): Promise<Contract> {
    let brandId = attrs?.brandId;
    if (!brandId) {
      const brandFactory = new BrandFactory(this.dataSource);
      const brand = await brandFactory.create();
      brandId = brand.id;
    }
    const contract = await this.make({ brandId, ...attrs });
    return this.dataSource.getRepository(Contract).save(contract);
  }
}


