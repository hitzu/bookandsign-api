import type { FactorizedAttrs } from '@jorgebodega/typeorm-factory';
import { Factory } from '@jorgebodega/typeorm-factory';
import { faker } from '@faker-js/faker';
import type { DataSource } from 'typeorm';

import { Brand } from '../../../src/brands/entities/brand.entity';
import { Extra } from '../../../src/extras/entities/extra.entity';
import { EXTRA_STATUS } from '../../../src/extras/types/extras-status.types';
import { BrandFactory } from '../brands/brands.factories';

export class ExtraFactory extends Factory<Extra> {
  protected entity = Extra;
  protected dataSource: DataSource;

  constructor(dataSource: DataSource) {
    super();
    this.dataSource = dataSource;
  }

  protected attrs(): FactorizedAttrs<Extra> {
    return {
      brandId: 0,
      name: faker.commerce.productName(),
      description: faker.commerce.productDescription(),
      price: faker.number.float({ min: 1, max: 10000, fractionDigits: 2 }),
      status: faker.helpers.arrayElement<EXTRA_STATUS>(
        Object.values(EXTRA_STATUS),
      ),
    };
  }

  async makeForBrand(brand: Brand, attrs?: Partial<Extra>): Promise<Extra> {
    return this.make({
      brandId: brand.id,
      brand,
      ...attrs,
    });
  }

  async createForBrand(brand: Brand, attrs?: Partial<Extra>): Promise<Extra> {
    const extra = await this.makeForBrand(brand, attrs);
    return this.dataSource.getRepository(Extra).save(extra);
  }

  async create(attrs?: Partial<Extra>): Promise<Extra> {
    const extra = await this.make(attrs);
    if (!extra.brandId) {
      const brandFactory = new BrandFactory(this.dataSource);
      const brand = await brandFactory.create();
      extra.brandId = brand.id;
      extra.brand = brand;
    }
    return this.dataSource.getRepository(Extra).save(extra);
  }

  async createActive(brand?: Brand, attrs?: Partial<Extra>): Promise<Extra> {
    if (brand) {
      return this.createForBrand(brand, {
        status: EXTRA_STATUS.ACTIVE,
        ...attrs,
      });
    }
    return this.create({
      status: EXTRA_STATUS.ACTIVE,
      ...attrs,
    });
  }

  async createInactive(brand?: Brand, attrs?: Partial<Extra>): Promise<Extra> {
    if (brand) {
      return this.createForBrand(brand, {
        status: EXTRA_STATUS.INACTIVE,
        ...attrs,
      });
    }
    return this.create({
      status: EXTRA_STATUS.INACTIVE,
      ...attrs,
    });
  }
}
