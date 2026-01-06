import type { FactorizedAttrs } from '@jorgebodega/typeorm-factory';
import { Factory } from '@jorgebodega/typeorm-factory';
import { faker } from '@faker-js/faker';
import type { DataSource } from 'typeorm';

import { ContractPackage } from '../../../src/contracts/entities/contract-package.entity';
import { CONTRACT_PACKAGE_SOURCE } from '../../../src/contracts/types/contract-package-source.types';
import { ContractFactory } from './contract.factory';
import { PackageFactory } from '../packages/package.factory';
import type { Contract } from '../../../src/contracts/entities/contract.entity';
import type { Package } from '../../../src/packages/entities/package.entity';

export class ContractPackageFactory extends Factory<ContractPackage> {
  protected entity = ContractPackage;
  protected dataSource: DataSource;

  constructor(dataSource: DataSource) {
    super();
    this.dataSource = dataSource;
  }

  protected attrs(): FactorizedAttrs<ContractPackage> {
    return {
      contractId: 0,
      packageId: 0,
      quantity: faker.number.int({ min: 1, max: 5 }),
      unitPrice: faker.number.float({ min: 1, max: 10000, fractionDigits: 2 }),
      source: CONTRACT_PACKAGE_SOURCE.PACKAGE,
      displayAsSaving: false,
    };
  }

  async createForContractAndPackage(
    contract: Contract,
    pkg: Package,
    attrs?: Partial<ContractPackage>,
  ): Promise<ContractPackage> {
    const item = await this.make({
      contractId: contract.id,
      packageId: pkg.id,
      ...attrs,
    });
    return this.dataSource.getRepository(ContractPackage).save(item);
  }

  async create(attrs?: Partial<ContractPackage>): Promise<ContractPackage> {
    const contractFactory = new ContractFactory(this.dataSource);
    const packageFactory = new PackageFactory(this.dataSource);
    const contract =
      attrs?.contractId != null
        ? await this.dataSource.getRepository(Contract).findOneByOrFail({
            id: attrs.contractId,
          })
        : await contractFactory.create();
    const pkg =
      attrs?.packageId != null
        ? await this.dataSource.getRepository(Package).findOneByOrFail({
            id: attrs.packageId,
          })
        : await packageFactory.createActive();
    const item = await this.make({
      contractId: contract.id,
      packageId: pkg.id,
      ...attrs,
    });
    return this.dataSource.getRepository(ContractPackage).save(item);
  }
}


