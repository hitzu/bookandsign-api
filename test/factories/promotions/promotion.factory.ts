import type { FactorizedAttrs } from '@jorgebodega/typeorm-factory';
import { Factory } from '@jorgebodega/typeorm-factory';
import { faker } from '@faker-js/faker';
import type { DataSource } from 'typeorm';

import { Brand } from '../../../src/brands/entities/brand.entity';
import {
  Promotion,
  PROMOTION_STATUS,
  PROMOTION_TYPE,
} from '../../../src/promotions/entities/promotion.entity';
import { BrandFactory } from '../brands/brands.factories';

export class PromotionFactory extends Factory<Promotion> {
  protected entity = Promotion;
  protected dataSource: DataSource;

  constructor(dataSource: DataSource) {
    super();
    this.dataSource = dataSource;
  }

  protected attrs(): FactorizedAttrs<Promotion> {
    return {
      brandId: 0,
      name: faker.commerce.productName(),
      type: PROMOTION_TYPE.PERCENTAGE,
      value: faker.number.float({ min: 1, max: 100, fractionDigits: 2 }),
      status: PROMOTION_STATUS.ACTIVE,
      validFrom: null,
      validUntil: null,
    };
  }

  async createForBrand(
    brand: Brand,
    attrs?: Partial<Promotion>,
  ): Promise<Promotion> {
    const promotion = await this.make({
      brandId: brand.id,
      brand,
      ...attrs,
    });
    return this.dataSource.getRepository(Promotion).save(promotion);
  }

  async create(attrs?: Partial<Promotion>): Promise<Promotion> {
    const promotion = await this.make(attrs);
    if (!promotion.brandId) {
      const brand = await new BrandFactory(this.dataSource).create();
      promotion.brandId = brand.id;
      promotion.brand = brand;
    }
    return this.dataSource.getRepository(Promotion).save(promotion);
  }
}
