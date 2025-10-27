import { DataSource } from 'typeorm';
import { Factory, FactorizedAttrs } from '@jorgebodega/typeorm-factory';
import { faker } from '@faker-js/faker';
import { Brand } from './brand.entity';
import { BrandKey } from '../brands.constants';

export class BrandFactory extends Factory<Brand> {
  protected entity = Brand;
  protected dataSource: DataSource;

  constructor(dataSource: DataSource) {
    super();
    this.dataSource = dataSource;
  }

  protected attrs(): FactorizedAttrs<Brand> {
    return {
      key: faker.helpers.arrayElement<BrandKey>([
        BrandKey.LUSSO,
        BrandKey.BRILLIPOINT,
        BrandKey.ALETVIA,
      ]),
      name: faker.company.name(),
      theme: {
        primaryColor: faker.color.rgb(),
        secondaryColor: faker.color.rgb(),
      },
    };
  }
}
