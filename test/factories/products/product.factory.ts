import type { FactorizedAttrs } from '@jorgebodega/typeorm-factory';
import { DataSource } from 'typeorm';
import { faker } from '@faker-js/faker';
import { Factory } from '@jorgebodega/typeorm-factory';
import { Product } from '../../../src/products/entities/product.entity';
import { Brand } from '../../../src/brands/entities/brand.entity';
import { PROMOTIONAL_TYPE } from '../../../src/products/constants/promotional_type.enum';

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
      promotionalType: faker.helpers.arrayElement<PROMOTIONAL_TYPE>(
        Object.values(PROMOTIONAL_TYPE),
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
}
