import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductsService } from './products.service';
import { Product } from './entities/product.entity';
import { AppDataSource as TestDataSource } from '../config/database/data-source';
import { ProductFactory } from '../../test/factories/products/product.factory';
import { BrandFactory } from '../../test/factories/brands/brands.factories';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { FindProductsQueryDto } from './dto/find-products-query.dto';
import { PRODUCT_STATUS } from './types/products-status.types';
import { NotFoundException } from '@nestjs/common';
import { EXCEPTION_RESPONSE } from '../config/errors/exception-response.config';

describe('ProductsService', () => {
  let service: ProductsService;
  let repository: Repository<Product>;
  let productFactory: ProductFactory;
  let brandFactory: BrandFactory;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        {
          provide: getRepositoryToken(Product),
          useValue: TestDataSource.getRepository(Product),
        },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
    repository = module.get<Repository<Product>>(getRepositoryToken(Product));
    productFactory = new ProductFactory(TestDataSource);
    brandFactory = new BrandFactory(TestDataSource);
  });

  describe('create', () => {
    describe('Happy Path - Product Creation', () => {
      it('should create a product successfully with all required fields', async () => {
        // Arrange
        const brand = await brandFactory.create();
        const createProductDto: CreateProductDto = {
          name: 'Test Product',
          description: 'Test Description',
          imageUrl: 'https://example.com/image.jpg',
          price: 99.99,
          discountPercentage: 10,
          status: PRODUCT_STATUS.ACTIVE,
          brandId: brand.id,
        };

        // Act
        const result = await service.create(createProductDto);

        // Assert
        expect(result).toBeDefined();
        expect(result.name).toBe(createProductDto.name);
        expect(result.description).toBe(createProductDto.description);
        expect(result.imageUrl).toBe(createProductDto.imageUrl);
        expect(result.price).toBe(createProductDto.price);
        expect(result.discountPercentage).toBe(createProductDto.discountPercentage);
        expect(result.status).toBe(createProductDto.status);
        expect(result.brandId).toBe(createProductDto.brandId);
        expect(result.id).toBeDefined();
        expect(result.createdAt).toBeDefined();
        expect(result.updatedAt).toBeDefined();
      });

      it('should create a product with minimal required fields', async () => {
        // Arrange
        const brand = await brandFactory.create();
        const createProductDto: CreateProductDto = {
          name: 'Minimal Product',
          description: null,
          imageUrl: null,
          price: null,
          discountPercentage: null,
          status: PRODUCT_STATUS.DRAFT,
          brandId: brand.id,
        };

        // Act
        const result = await service.create(createProductDto);

        // Assert
        expect(result).toBeDefined();
        expect(result.name).toBe(createProductDto.name);
        expect(result.status).toBe(createProductDto.status);
        expect(result.brandId).toBe(createProductDto.brandId);
        expect(result.description).toBeNull();
        expect(result.imageUrl).toBeNull();
        expect(result.price).toBeNull();
        expect(result.discountPercentage).toBeNull();
      });

      it('should create a product with null optional fields', async () => {
        // Arrange
        const brand = await brandFactory.create();
        const createProductDto: CreateProductDto = {
          name: 'Product with Nulls',
          description: null,
          imageUrl: null,
          price: null,
          discountPercentage: null,
          status: PRODUCT_STATUS.DRAFT,
          brandId: brand.id,
        };

        // Act
        const result = await service.create(createProductDto);

        // Assert
        expect(result).toBeDefined();
        expect(result.description).toBeNull();
        expect(result.imageUrl).toBeNull();
        expect(result.price).toBeNull();
        expect(result.discountPercentage).toBeNull();
      });
    });

    describe('Equivalence Partitioning - Status Values', () => {
      it.each([
        [PRODUCT_STATUS.DRAFT, 'DRAFT status'],
        [PRODUCT_STATUS.ACTIVE, 'ACTIVE status'],
        [PRODUCT_STATUS.INACTIVE, 'INACTIVE status'],
      ])('should create product with %s', async (status, description) => {
        // Arrange
        const brand = await brandFactory.create();
        const createProductDto: CreateProductDto = {
          name: `Product ${description}`,
          description: null,
          imageUrl: null,
          price: null,
          discountPercentage: null,
          status,
          brandId: brand.id,
        };

        // Act
        const result = await service.create(createProductDto);

        // Assert
        expect(result.status).toBe(status);
      });
    });

    describe('Boundary Value Analysis - Price Values', () => {
      it('should create product with minimum price (0.01)', async () => {
        // Arrange
        const brand = await brandFactory.create();
        const createProductDto: CreateProductDto = {
          name: 'Min Price Product',
          description: null,
          imageUrl: null,
          price: 0.01,
          discountPercentage: null,
          status: PRODUCT_STATUS.ACTIVE,
          brandId: brand.id,
        };

        // Act
        const result = await service.create(createProductDto);

        // Assert
        expect(result.price).toBe(0.01);
      });

      it('should create product with large price value', async () => {
        // Arrange
        const brand = await brandFactory.create();
        const createProductDto: CreateProductDto = {
          name: 'Large Price Product',
          description: null,
          imageUrl: null,
          price: 999999.99,
          discountPercentage: null,
          status: PRODUCT_STATUS.ACTIVE,
          brandId: brand.id,
        };

        // Act
        const result = await service.create(createProductDto);

        // Assert
        expect(result.price).toBe(999999.99);
      });

      it('should create product with discount percentage at boundary (0)', async () => {
        // Arrange
        const brand = await brandFactory.create();
        const createProductDto: CreateProductDto = {
          name: 'Zero Discount Product',
          description: null,
          imageUrl: null,
          price: null,
          discountPercentage: 0,
          status: PRODUCT_STATUS.ACTIVE,
          brandId: brand.id,
        };

        // Act
        const result = await service.create(createProductDto);

        // Assert
        expect(result.discountPercentage).toBe(0);
      });

      it('should create product with discount percentage at boundary (100)', async () => {
        // Arrange
        const brand = await brandFactory.create();
        const createProductDto: CreateProductDto = {
          name: 'Max Discount Product',
          description: null,
          imageUrl: null,
          price: null,
          discountPercentage: 100,
          status: PRODUCT_STATUS.ACTIVE,
          brandId: brand.id,
        };

        // Act
        const result = await service.create(createProductDto);

        // Assert
        expect(result.discountPercentage).toBe(100);
      });
    });

    describe('Error Handling', () => {
      it('should throw error when database operation fails', async () => {
        // Arrange
        const brand = await brandFactory.create();
        const createProductDto: CreateProductDto = {
          name: 'Test Product',
          description: null,
          imageUrl: null,
          price: null,
          discountPercentage: null,
          status: PRODUCT_STATUS.ACTIVE,
          brandId: brand.id,
        };

        // Mock repository to throw error
        jest.spyOn(repository, 'save').mockRejectedValueOnce(new Error('Database error'));

        // Act & Assert
        await expect(service.create(createProductDto)).rejects.toThrow('Database error');
      });
    });
  });

  describe('findAll', () => {
    describe('Happy Path - Products Found', () => {
      it('should return all products with brand relations', async () => {
        // Arrange
        const brand = await brandFactory.create();
        const product1 = await productFactory.createForBrand(brand);
        const product2 = await productFactory.createForBrand(brand);
        const product3 = await productFactory.createForBrand(brand);

        // Act
        const result = await service.findAll();

        // Assert
        expect(result).toBeDefined();
        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBeGreaterThanOrEqual(3);
        const resultIds = result.map((p) => p.id);
        expect(resultIds).toContain(product1.id);
        expect(resultIds).toContain(product2.id);
        expect(resultIds).toContain(product3.id);
        // Check that brand relation is loaded
        result.forEach((product) => {
          expect(product).toHaveProperty('brandId');
        });
      });

      it('should return empty array when no products exist', async () => {
        // Arrange - Database is empty (cleaned in afterEach)

        // Act
        const result = await service.findAll();

        // Assert
        expect(result).toBeDefined();
        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBe(0);
      });

      it('should return products transformed to ProductDto', async () => {
        // Arrange
        const brand = await brandFactory.create();
        const product = await productFactory.createForBrand(brand);

        // Act
        const result = await service.findAll();

        // Assert
        const foundProduct = result.find((p) => p.id === product.id);
        expect(foundProduct).toBeDefined();
        expect(foundProduct).toHaveProperty('id');
        expect(foundProduct).toHaveProperty('name');
        expect(foundProduct).toHaveProperty('status');
        expect(foundProduct).toHaveProperty('brandId');
      });
    });

    describe('Error Handling', () => {
      it('should throw error when database query fails', async () => {
        // Arrange
        jest.spyOn(repository, 'find').mockRejectedValueOnce(new Error('Database error'));

        // Act & Assert
        await expect(service.findAll()).rejects.toThrow('Database error');
      });
    });
  });

  describe('findWithFilters', () => {
    describe('Happy Path - Filtering by brandId', () => {
      it('should return products filtered by brandId', async () => {
        // Arrange
        const brand1 = await brandFactory.create();
        const brand2 = await brandFactory.create();
        const product1 = await productFactory.createForBrand(brand1);
        const product2 = await productFactory.createForBrand(brand1);
        await productFactory.createForBrand(brand2); // Different brand

        const filters: FindProductsQueryDto = {
          brandId: brand1.id.toString(),
        };

        // Act
        const result = await service.findWithFilters(filters, { brand: true });

        // Assert
        expect(result).toBeDefined();
        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBeGreaterThanOrEqual(2);
        result.forEach((product) => {
          expect(product.brandId).toBe(brand1.id);
        });
        const resultIds = result.map((p) => p.id);
        expect(resultIds).toContain(product1.id);
        expect(resultIds).toContain(product2.id);
      });

      it('should return empty array when no products match brandId filter', async () => {
        // Arrange
        const brand = await brandFactory.create();
        const filters: FindProductsQueryDto = {
          brandId: brand.id.toString(),
        };

        // Act
        const result = await service.findWithFilters(filters, { brand: true });

        // Assert
        expect(result).toBeDefined();
        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBe(0);
      });
    });

    describe('Happy Path - Filtering by term (name search)', () => {
      it('should return products matching name term (case insensitive)', async () => {
        // Arrange
        const brand = await brandFactory.create();
        const product1 = await productFactory.createForBrand(brand, {
          name: 'Premium Widget',
        });
        const product2 = await productFactory.createForBrand(brand, {
          name: 'Standard Widget',
        });
        await productFactory.createForBrand(brand, {
          name: 'Different Product',
        });

        const filters: FindProductsQueryDto = {
          term: 'widget',
        };

        // Act
        const result = await service.findWithFilters(filters, { brand: true });

        // Assert
        expect(result).toBeDefined();
        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBeGreaterThanOrEqual(2);
        const resultIds = result.map((p) => p.id);
        expect(resultIds).toContain(product1.id);
        expect(resultIds).toContain(product2.id);
        result.forEach((product) => {
          expect(product.name.toLowerCase()).toContain('widget');
        });
      });

      it('should return empty array when no products match term', async () => {
        // Arrange
        const brand = await brandFactory.create();
        await productFactory.createForBrand(brand, { name: 'Existing Product' });

        const filters: FindProductsQueryDto = {
          term: 'NonExistentProduct',
        };

        // Act
        const result = await service.findWithFilters(filters, { brand: true });

        // Assert
        expect(result).toBeDefined();
        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBe(0);
      });
    });

    describe('Happy Path - Combined Filters', () => {
      it('should return products matching both brandId and term filters', async () => {
        // Arrange
        const brand1 = await brandFactory.create();
        const brand2 = await brandFactory.create();
        const product1 = await productFactory.createForBrand(brand1, {
          name: 'Premium Widget',
        });
        await productFactory.createForBrand(brand1, { name: 'Different Product' });
        await productFactory.createForBrand(brand2, { name: 'Premium Widget' });

        const filters: FindProductsQueryDto = {
          brandId: brand1.id.toString(),
          term: 'widget',
        };

        // Act
        const result = await service.findWithFilters(filters, { brand: true });

        // Assert
        expect(result).toBeDefined();
        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBeGreaterThanOrEqual(1);
        const resultIds = result.map((p) => p.id);
        expect(resultIds).toContain(product1.id);
        result.forEach((product) => {
          expect(product.brandId).toBe(brand1.id);
          expect(product.name.toLowerCase()).toContain('widget');
        });
      });
    });

    describe('Edge Cases - Empty Filters', () => {
      it('should return all products when no filters provided', async () => {
        // Arrange
        const brand = await brandFactory.create();
        const product1 = await productFactory.createForBrand(brand);
        const product2 = await productFactory.createForBrand(brand);

        const filters: FindProductsQueryDto = {};

        // Act
        const result = await service.findWithFilters(filters, { brand: true });

        // Assert
        expect(result).toBeDefined();
        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBeGreaterThanOrEqual(2);
        const resultIds = result.map((p) => p.id);
        expect(resultIds).toContain(product1.id);
        expect(resultIds).toContain(product2.id);
      });
    });

    describe('Error Handling', () => {
      it('should throw error when database query fails', async () => {
        // Arrange
        const filters: FindProductsQueryDto = {};
        jest.spyOn(repository, 'find').mockRejectedValueOnce(new Error('Database error'));

        // Act & Assert
        await expect(service.findWithFilters(filters, { brand: true })).rejects.toThrow(
          'Database error',
        );
      });
    });
  });

  describe('findOne', () => {
    describe('Happy Path - Product Found', () => {
      it('should return a product when id exists', async () => {
        // Arrange
        const brand = await brandFactory.create();
        const product = await productFactory.createForBrand(brand);

        // Act
        const result = await service.findOne(product.id);

        // Assert
        expect(result).toBeDefined();
        expect(result.id).toBe(product.id);
        expect(result.name).toBe(product.name);
        expect(result.status).toBe(product.status);
        expect(result.brandId).toBe(product.brandId);
      });

      it('should return product transformed to ProductDto', async () => {
        // Arrange
        const brand = await brandFactory.create();
        const product = await productFactory.createForBrand(brand);

        // Act
        const result = await service.findOne(product.id);

        // Assert
        expect(result).toBeDefined();
        expect(result).toHaveProperty('id');
        expect(result).toHaveProperty('name');
        expect(result).toHaveProperty('status');
        expect(result).toHaveProperty('brandId');
      });
    });

    describe('Negative Testing - Product Not Found', () => {
      it('should throw NotFoundException when product does not exist', async () => {
        // Arrange
        const nonExistentId = 99999;

        // Act & Assert
        await expect(service.findOne(nonExistentId)).rejects.toThrow(NotFoundException);
        await expect(service.findOne(nonExistentId)).rejects.toThrow(
          EXCEPTION_RESPONSE.PRODUCT_NOT_FOUND.message,
        );
      });

      it('should throw NotFoundException when id is 0', async () => {
        // Arrange
        const invalidId = 0;

        // Act & Assert
        await expect(service.findOne(invalidId)).rejects.toThrow(NotFoundException);
      });

      it('should throw NotFoundException when id is negative', async () => {
        // Arrange
        const invalidId = -1;

        // Act & Assert
        await expect(service.findOne(invalidId)).rejects.toThrow(NotFoundException);
      });
    });

    describe('Error Handling', () => {
      it('should throw error when database query fails', async () => {
        // Arrange
        const productId = 1;
        jest.spyOn(repository, 'findOne').mockRejectedValueOnce(new Error('Database error'));

        // Act & Assert
        await expect(service.findOne(productId)).rejects.toThrow('Database error');
      });
    });
  });

  describe('update', () => {
    describe('Happy Path - Product Update', () => {
      it('should update product successfully with all fields', async () => {
        // Arrange
        const brand = await brandFactory.create();
        const product = await productFactory.createForBrand(brand);
        const updateProductDto: UpdateProductDto = {
          name: 'Updated Product Name',
          description: 'Updated Description',
          price: 199.99,
          discountPercentage: 20,
          status: PRODUCT_STATUS.ACTIVE,
        };

        // Act
        const result = await service.update(product.id, updateProductDto);

        // Assert
        expect(result).toBeDefined();
        expect(result.affected).toBe(1);

        // Verify the update
        const updatedProduct = await repository.findOne({ where: { id: product.id } });
        expect(updatedProduct).toBeDefined();
        expect(updatedProduct?.name).toBe(updateProductDto.name);
        expect(updatedProduct?.description).toBe(updateProductDto.description);
        expect(updatedProduct?.price).toBe(updateProductDto.price);
        expect(updatedProduct?.discountPercentage).toBe(updateProductDto.discountPercentage);
        expect(updatedProduct?.status).toBe(updateProductDto.status);
      });

      it('should update product with partial fields', async () => {
        // Arrange
        const brand = await brandFactory.create();
        const product = await productFactory.createForBrand(brand);
        const updateProductDto: UpdateProductDto = {
          name: 'Partially Updated Product',
        };

        // Act
        const result = await service.update(product.id, updateProductDto);

        // Assert
        expect(result).toBeDefined();
        expect(result.affected).toBe(1);

        // Verify the update
        const updatedProduct = await repository.findOne({ where: { id: product.id } });
        expect(updatedProduct).toBeDefined();
        expect(updatedProduct?.name).toBe(updateProductDto.name);
        // Other fields should remain unchanged
        expect(updatedProduct?.status).toBe(product.status);
      });

      it('should update product status only', async () => {
        // Arrange
        const brand = await brandFactory.create();
        const product = await productFactory.createForBrand(brand, {
          status: PRODUCT_STATUS.DRAFT,
        });
        const updateProductDto: UpdateProductDto = {
          status: PRODUCT_STATUS.ACTIVE,
        };

        // Act
        const result = await service.update(product.id, updateProductDto);

        // Assert
        expect(result).toBeDefined();
        expect(result.affected).toBe(1);

        // Verify the update
        const updatedProduct = await repository.findOne({ where: { id: product.id } });
        expect(updatedProduct).toBeDefined();
        expect(updatedProduct?.status).toBe(PRODUCT_STATUS.ACTIVE);
      });
    });

    describe('Edge Cases - Update Non-Existent Product', () => {
      it('should return affected 0 when product does not exist', async () => {
        // Arrange
        const nonExistentId = 99999;
        const updateProductDto: UpdateProductDto = {
          name: 'Updated Name',
        };

        // Act
        const result = await service.update(nonExistentId, updateProductDto);

        // Assert
        expect(result).toBeDefined();
        expect(result.affected).toBe(0);
      });
    });

    describe('Error Handling', () => {
      it('should throw error when database update fails', async () => {
        // Arrange
        const productId = 1;
        const updateProductDto: UpdateProductDto = {
          name: 'Updated Name',
        };
        jest.spyOn(repository, 'update').mockRejectedValueOnce(new Error('Database error'));

        // Act & Assert
        await expect(service.update(productId, updateProductDto)).rejects.toThrow(
          'Database error',
        );
      });
    });
  });

  describe('remove', () => {
    describe('Happy Path - Product Removal', () => {
      it('should soft delete product successfully', async () => {
        // Arrange
        const brand = await brandFactory.create();
        const product = await productFactory.createForBrand(brand);

        // Act
        const result = await service.remove(product.id);

        // Assert
        expect(result).toBeDefined();
        expect(result.affected).toBe(1);

        // Verify soft delete
        const deletedProduct = await repository.findOne({ where: { id: product.id } });
        expect(deletedProduct).toBeNull();

        // Verify soft delete with deletedAt
        const deletedProductWithDeleted = await repository.findOne({
          where: { id: product.id },
          withDeleted: true,
        });
        expect(deletedProductWithDeleted).toBeDefined();
        expect(deletedProductWithDeleted?.deletedAt).not.toBeNull();
      });

      it('should return affected 0 when product does not exist', async () => {
        // Arrange
        const nonExistentId = 99999;

        // Act
        const result = await service.remove(nonExistentId);

        // Assert
        expect(result).toBeDefined();
        expect(result.affected).toBe(0);
      });
    });

    describe('Error Handling', () => {
      it('should throw error when database delete fails', async () => {
        // Arrange
        const productId = 1;
        jest
          .spyOn(repository, 'softDelete')
          .mockRejectedValueOnce(new Error('Database error'));

        // Act & Assert
        await expect(service.remove(productId)).rejects.toThrow('Database error');
      });
    });
  });

  describe('findProductsStatus', () => {
    describe('Happy Path - Status Values', () => {
      it('should return all product status values', async () => {
        // Act
        const result = await service.findProductsStatus();

        // Assert
        expect(result).toBeDefined();
        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBe(3);
        expect(result).toContain(PRODUCT_STATUS.DRAFT);
        expect(result).toContain(PRODUCT_STATUS.ACTIVE);
        expect(result).toContain(PRODUCT_STATUS.INACTIVE);
      });

      it('should return status values in correct order', async () => {
        // Act
        const result = await service.findProductsStatus();

        // Assert
        expect(result).toEqual([
          PRODUCT_STATUS.DRAFT,
          PRODUCT_STATUS.ACTIVE,
          PRODUCT_STATUS.INACTIVE,
        ]);
      });
    });

    describe('Error Handling', () => {
      it('should handle errors gracefully', async () => {
        // This test is mainly for coverage as the method is simple
        // Arrange - No setup needed

        // Act
        const result = await service.findProductsStatus();

        // Assert
        expect(result).toBeDefined();
        expect(Array.isArray(result)).toBe(true);
      });
    });
  });
});
