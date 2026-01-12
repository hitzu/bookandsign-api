import type { FactorizedAttrs } from '@jorgebodega/typeorm-factory';
import { faker } from '@faker-js/faker';
import { Factory } from '@jorgebodega/typeorm-factory';
import { DataSource } from 'typeorm';
import { Brand } from '../../../src/brands/entities/brand.entity';

export class BrandFactory extends Factory<Brand> {
  protected entity = Brand;
  protected dataSource: DataSource;

  constructor(dataSource: DataSource) {
    super();
    this.dataSource = dataSource;
  }

  protected attrs(): FactorizedAttrs<Brand> {
    return {
      name: faker.company.name(),
      logoUrl: faker.internet.url(),
      phoneNumber: faker.phone.number(),
      email: faker.internet.email(),
    };
  }
}
