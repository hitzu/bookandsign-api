import type { FactorizedAttrs } from '@jorgebodega/typeorm-factory';
import { DataSource } from 'typeorm';
import { Factory } from '@jorgebodega/typeorm-factory';
import { BrandTerm } from '../../../src/terms/entities/brand-term.entity';
import { Term } from '../../../src/terms/entities/term.entity';
import { Brand } from '../../../src/brands/entities/brand.entity';

export class BrandTermFactory extends Factory<BrandTerm> {
  protected entity = BrandTerm;
  protected dataSource: DataSource;

  constructor(dataSource: DataSource) {
    super();
    this.dataSource = dataSource;
  }

  protected attrs(): FactorizedAttrs<BrandTerm> {
    return {
      brandId: 0,
      termId: 0,
    };
  }

  async makeForBrandAndTerm(brand: Brand, term: Term): Promise<BrandTerm> {
    return this.make({
      brandId: brand.id,
      termId: term.id,
      brand,
      term,
    });
  }

  async createForBrandAndTerm(brand: Brand, term: Term): Promise<BrandTerm> {
    const brandTerm = await this.makeForBrandAndTerm(brand, term);
    return this.dataSource.getRepository(BrandTerm).save(brandTerm);
  }
}
