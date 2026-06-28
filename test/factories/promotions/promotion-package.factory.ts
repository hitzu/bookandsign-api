import type { FactorizedAttrs } from '@jorgebodega/typeorm-factory';
import { Factory } from '@jorgebodega/typeorm-factory';
import { faker } from '@faker-js/faker';
import type { DataSource } from 'typeorm';

import { PromotionPackage } from '../../../src/promotions/entities/promotion-package.entity';
import type { Promotion } from '../../../src/promotions/entities/promotion.entity';
import type { Package } from '../../../src/packages/entities/package.entity';

export class PromotionPackageFactory extends Factory<PromotionPackage> {
  protected entity = PromotionPackage;
  protected dataSource: DataSource;

  constructor(dataSource: DataSource) {
    super();
    this.dataSource = dataSource;
  }

  protected attrs(): FactorizedAttrs<PromotionPackage> {
    return {
      promotionId: 0,
      packageId: 0,
      tierOrder: 1,
      discountPercentage: faker.number.float({
        min: 1,
        max: 100,
        fractionDigits: 2,
      }),
    };
  }

  async createTier(
    promotion: Promotion,
    pkg: Package,
    tierOrder: number,
    discountPercentage: number,
  ): Promise<PromotionPackage> {
    const row = await this.make({
      promotionId: promotion.id,
      packageId: pkg.id,
      tierOrder,
      discountPercentage,
    });
    return this.dataSource.getRepository(PromotionPackage).save(row);
  }
}
