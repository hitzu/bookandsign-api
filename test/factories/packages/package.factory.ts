import type { FactorizedAttrs } from '@jorgebodega/typeorm-factory';
import { DataSource } from 'typeorm';
import { faker } from '@faker-js/faker';
import { Factory } from '@jorgebodega/typeorm-factory';
import { Package } from '../../../src/packages/entities/package.entity';
import { PACKAGE_STATUS } from '../../../src/packages/types/packages-status.types';
import { Brand } from '../../../src/brands/entities/brand.entity';
import { BrandFactory } from '../brands/brands.factories';

export class PackageFactory extends Factory<Package> {
  protected entity = Package;
  protected dataSource: DataSource;

  constructor(dataSource: DataSource) {
    super();
    this.dataSource = dataSource;
  }

  protected attrs(): FactorizedAttrs<Package> {
    return {
      code: faker.string.alphanumeric({ length: 10, casing: 'upper' }),
      name: faker.commerce.productName(),
      description: faker.commerce.productDescription(),
      basePrice: faker.number.float({ min: 1, max: 100000, fractionDigits: 2 }),
      discount: faker.number.float({ min: 0, max: 100, fractionDigits: 2 }),
      status: faker.helpers.arrayElement<PACKAGE_STATUS>(
        Object.values(PACKAGE_STATUS),
      ),
      // brandId should be provided via makeForBrand or createForBrand methods
      brandId: 0, // Placeholder, will be overridden
    };
  }

  /**
   * Creates a package with a specific brand
   */
  async makeForBrand(brand: Brand, attrs?: Partial<Package>): Promise<Package> {
    return this.make({
      brandId: brand.id,
      brand,
      ...attrs,
    });
  }

  /**
   * Creates and persists a package with a specific brand
   */
  async createForBrand(
    brand: Brand,
    attrs?: Partial<Package>,
  ): Promise<Package> {
    const packageEntity = await this.makeForBrand(brand, attrs);
    return this.dataSource.getRepository(Package).save(packageEntity);
  }

  /**
   * Creates a package with ACTIVE status
   */
  async makeActive(brand?: Brand): Promise<Package> {
    const attrs: Partial<Package> = {
      status: PACKAGE_STATUS.ACTIVE,
    };
    if (brand) {
      attrs.brandId = brand.id;
      attrs.brand = brand;
    } else {
      // Create a brand if not provided
      const brandFactory = new BrandFactory(this.dataSource);
      const newBrand = await brandFactory.create();
      attrs.brandId = newBrand.id;
      attrs.brand = newBrand;
    }
    return this.make(attrs);
  }

  /**
   * Creates and persists a package with ACTIVE status
   */
  async createActive(brand?: Brand): Promise<Package> {
    const packageEntity = await this.makeActive(brand);
    return this.dataSource.getRepository(Package).save(packageEntity);
  }

  /**
   * Creates a package with DRAFT status
   */
  async makeDraft(brand?: Brand): Promise<Package> {
    const attrs: Partial<Package> = {
      status: PACKAGE_STATUS.DRAFT,
    };
    if (brand) {
      attrs.brandId = brand.id;
      attrs.brand = brand;
    } else {
      // Create a brand if not provided
      const brandFactory = new BrandFactory(this.dataSource);
      const newBrand = await brandFactory.create();
      attrs.brandId = newBrand.id;
      attrs.brand = newBrand;
    }
    return this.make(attrs);
  }

  /**
   * Creates and persists a package with DRAFT status
   */
  async createDraft(brand?: Brand): Promise<Package> {
    const packageEntity = await this.makeDraft(brand);
    return this.dataSource.getRepository(Package).save(packageEntity);
  }
}
