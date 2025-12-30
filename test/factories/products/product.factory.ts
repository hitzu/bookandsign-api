import type { FactorizedAttrs } from '@jorgebodega/typeorm-factory';
import { DataSource } from 'typeorm';
import { faker } from '@faker-js/faker';
import { Factory } from '@jorgebodega/typeorm-factory';
import { Product } from '../../../src/products/entities/product.entity';
import { PRODUCT_STATUS } from '../../../src/products/types/products-status.types';
import { Brand } from '../../../src/brands/entities/brand.entity';
import { BrandFactory } from '../brands/brands.factories';

export class ProductFactory extends Factory<Product> {
  protected entity = Product;
  protected dataSource: DataSource;

  constructor(dataSource: DataSource) {
    super();
    this.dataSource = dataSource;
  }

  protected attrs(): FactorizedAttrs<Product> {
    return {
      name: faker.commerce.productName(),
      description: faker.commerce.productDescription(),
      imageUrl: faker.image.url(),
      price: faker.number.float({ min: 1, max: 10000, fractionDigits: 2 }),
      discountPercentage: faker.number.float({
        min: 0,
        max: 100,
        fractionDigits: 2,
      }),
      status: faker.helpers.arrayElement<PRODUCT_STATUS>(
        Object.values(PRODUCT_STATUS),
      ),
      // brandId should be provided via makeForBrand or createForBrand methods
      brandId: 0, // Placeholder, will be overridden
    };
  }

  /**
   * Creates a product with a specific brand
   */
  async makeForBrand(brand: Brand, attrs?: Partial<Product>): Promise<Product> {
    return this.make({
      brandId: brand.id,
      brand,
      ...attrs,
    });
  }

  /**
   * Creates and persists a product with a specific brand
   */
  async createForBrand(
    brand: Brand,
    attrs?: Partial<Product>,
  ): Promise<Product> {
    const product = await this.makeForBrand(brand, attrs);
    return this.dataSource.getRepository(Product).save(product);
  }

  /**
   * Creates a product with ACTIVE status
   */
  async makeActive(brand?: Brand): Promise<Product> {
    const attrs: Partial<Product> = {
      status: PRODUCT_STATUS.ACTIVE,
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
   * Creates and persists a product with ACTIVE status
   */
  async createActive(brand?: Brand): Promise<Product> {
    const product = await this.makeActive(brand);
    return this.dataSource.getRepository(Product).save(product);
  }

  /**
   * Creates a product with DRAFT status
   */
  async makeDraft(brand?: Brand): Promise<Product> {
    const attrs: Partial<Product> = {
      status: PRODUCT_STATUS.DRAFT,
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
   * Creates and persists a product with DRAFT status
   */
  async createDraft(brand?: Brand): Promise<Product> {
    const product = await this.makeDraft(brand);
    return this.dataSource.getRepository(Product).save(product);
  }
}
