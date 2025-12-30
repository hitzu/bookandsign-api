import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PackagesService } from './packages.service';
import { Package } from './entities/package.entity';
import { PackageProduct } from './entities/package-product.entity';
import { AppDataSource as TestDataSource } from '../config/database/data-source';
import { PackageFactory } from '../../test/factories/packages/package.factory';
import { ProductFactory } from '../../test/factories/products/product.factory';
import { BrandFactory } from '../../test/factories/brands/brands.factories';
import { CreatePackageDto } from './dto/create-package.dto';
import { UpdatePackageDto } from './dto/update-package.dto';
import { AddProductsToPackageDto } from './dto/add-products-package.dto';
import { FindPackagesQueryDto } from './dto/find-packages-query.dto';
import { PACKAGE_STATUS } from './types/packages-status.types';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { EXCEPTION_RESPONSE } from '../config/errors/exception-response.config';

describe('PackagesService', () => {
  let service: PackagesService;
  let packagesRepository: Repository<Package>;
  let packageProductsRepository: Repository<PackageProduct>;
  let packageFactory: PackageFactory;
  let productFactory: ProductFactory;
  let brandFactory: BrandFactory;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PackagesService,
        {
          provide: getRepositoryToken(Package),
          useValue: TestDataSource.getRepository(Package),
        },
        {
          provide: getRepositoryToken(PackageProduct),
          useValue: TestDataSource.getRepository(PackageProduct),
        },
      ],
    }).compile();

    service = module.get<PackagesService>(PackagesService);
    packagesRepository = module.get<Repository<Package>>(
      getRepositoryToken(Package),
    );
    packageProductsRepository = module.get<Repository<PackageProduct>>(
      getRepositoryToken(PackageProduct),
    );
    packageFactory = new PackageFactory(TestDataSource);
    productFactory = new ProductFactory(TestDataSource);
    brandFactory = new BrandFactory(TestDataSource);
  });

  describe('create', () => {
    describe('Happy Path - Package Creation', () => {
      it('should create a package successfully with all required fields', async () => {
        // Arrange
        const brand = await brandFactory.create();
        const createPackageDto: CreatePackageDto = {
          brandId: brand.id,
          code: 'PKG001',
          name: 'Test Package',
          description: 'Test Description',
          basePrice: 999.99,
          discount: 10,
          status: PACKAGE_STATUS.ACTIVE,
        };

        // Act
        const result = await service.create(createPackageDto);

        // Assert
        expect(result).toBeDefined();
        expect(result.code).toBe(createPackageDto.code);
        expect(result.name).toBe(createPackageDto.name);
        expect(result.description).toBe(createPackageDto.description);
        expect(result.basePrice).toBe(createPackageDto.basePrice);
        expect(result.discount).toBe(createPackageDto.discount);
        expect(result.status).toBe(createPackageDto.status);
        expect(result.brandId).toBe(createPackageDto.brandId);
        expect(result.id).toBeDefined();
        expect(result.createdAt).toBeDefined();
        expect(result.updatedAt).toBeDefined();
      });

      it('should create a package with minimal required fields', async () => {
        // Arrange
        const brand = await brandFactory.create();
        const createPackageDto: CreatePackageDto = {
          brandId: brand.id,
          code: 'PKG002',
          name: 'Minimal Package',
          description: null,
          basePrice: null,
          discount: null,
          status: PACKAGE_STATUS.DRAFT,
        };

        // Act
        const result = await service.create(createPackageDto);

        // Assert
        expect(result).toBeDefined();
        expect(result.code).toBe(createPackageDto.code);
        expect(result.name).toBe(createPackageDto.name);
        expect(result.status).toBe(createPackageDto.status);
        expect(result.brandId).toBe(createPackageDto.brandId);
        expect(result.description).toBeNull();
        expect(result.basePrice).toBeNull();
        expect(result.discount).toBeNull();
      });

      it('should create a package with null optional fields', async () => {
        // Arrange
        const brand = await brandFactory.create();
        const createPackageDto: CreatePackageDto = {
          brandId: brand.id,
          code: 'PKG003',
          name: 'Package with Nulls',
          description: null,
          basePrice: null,
          discount: null,
          status: PACKAGE_STATUS.DRAFT,
        };

        // Act
        const result = await service.create(createPackageDto);

        // Assert
        expect(result).toBeDefined();
        expect(result.description).toBeNull();
        expect(result.basePrice).toBeNull();
        expect(result.discount).toBeNull();
      });
    });

    describe('Equivalence Partitioning - Status Values', () => {
      it.each([
        [PACKAGE_STATUS.DRAFT, 'DRAFT status'],
        [PACKAGE_STATUS.ACTIVE, 'ACTIVE status'],
        [PACKAGE_STATUS.INACTIVE, 'INACTIVE status'],
      ])('should create package with %s', async (status, description) => {
        // Arrange
        const brand = await brandFactory.create();
        const createPackageDto: CreatePackageDto = {
          brandId: brand.id,
          code: `PKG-${status}`,
          name: `Package ${description}`,
          description: null,
          basePrice: null,
          discount: null,
          status,
        };

        // Act
        const result = await service.create(createPackageDto);

        // Assert
        expect(result.status).toBe(status);
      });
    });

    describe('Boundary Value Analysis - Price Values', () => {
      it('should create package with minimum basePrice (0.01)', async () => {
        // Arrange
        const brand = await brandFactory.create();
        const createPackageDto: CreatePackageDto = {
          brandId: brand.id,
          code: 'PKG-MIN',
          name: 'Min Price Package',
          description: null,
          basePrice: 0.01,
          discount: null,
          status: PACKAGE_STATUS.ACTIVE,
        };

        // Act
        const result = await service.create(createPackageDto);

        // Assert
        expect(result.basePrice).toBe(0.01);
      });

      it('should create package with large basePrice value', async () => {
        // Arrange
        const brand = await brandFactory.create();
        const createPackageDto: CreatePackageDto = {
          brandId: brand.id,
          code: 'PKG-MAX',
          name: 'Large Price Package',
          description: null,
          basePrice: 999999.99,
          discount: null,
          status: PACKAGE_STATUS.ACTIVE,
        };

        // Act
        const result = await service.create(createPackageDto);

        // Assert
        expect(result.basePrice).toBe(999999.99);
      });

      it('should create package with discount at boundary (0)', async () => {
        // Arrange
        const brand = await brandFactory.create();
        const createPackageDto: CreatePackageDto = {
          brandId: brand.id,
          code: 'PKG-ZERO',
          name: 'Zero Discount Package',
          description: null,
          basePrice: null,
          discount: 0,
          status: PACKAGE_STATUS.ACTIVE,
        };

        // Act
        const result = await service.create(createPackageDto);

        // Assert
        expect(result.discount).toBe(0);
      });

      it('should create package with discount at boundary (100)', async () => {
        // Arrange
        const brand = await brandFactory.create();
        const createPackageDto: CreatePackageDto = {
          brandId: brand.id,
          code: 'PKG-100',
          name: 'Max Discount Package',
          description: null,
          basePrice: null,
          discount: 100,
          status: PACKAGE_STATUS.ACTIVE,
        };

        // Act
        const result = await service.create(createPackageDto);

        // Assert
        expect(result.discount).toBe(100);
      });
    });

    describe('Error Handling', () => {
      it('should throw error when database operation fails', async () => {
        // Arrange
        const brand = await brandFactory.create();
        const createPackageDto: CreatePackageDto = {
          brandId: brand.id,
          code: 'PKG-ERR',
          name: 'Error Package',
          description: null,
          basePrice: null,
          discount: null,
          status: PACKAGE_STATUS.ACTIVE,
        };

        // Mock repository to throw error
        jest
          .spyOn(packagesRepository, 'save')
          .mockRejectedValueOnce(new Error('Database error'));

        // Act & Assert
        await expect(service.create(createPackageDto)).rejects.toThrow(
          'Database error',
        );
      });
    });
  });

  describe('findAll', () => {
    describe('Happy Path - Packages Found', () => {
      it('should return all packages with relations', async () => {
        // Arrange
        const brand = await brandFactory.create();
        const package1 = await packageFactory.createForBrand(brand);
        const package2 = await packageFactory.createForBrand(brand);
        const package3 = await packageFactory.createForBrand(brand);

        // Act
        const result = await service.findAll();

        // Assert
        expect(result).toBeDefined();
        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBeGreaterThanOrEqual(3);
        const resultIds = result.map((p) => p.id);
        expect(resultIds).toContain(package1.id);
        expect(resultIds).toContain(package2.id);
        expect(resultIds).toContain(package3.id);
        // Check that relations are loaded
        result.forEach((pkg) => {
          expect(pkg).toHaveProperty('brand');
          expect(pkg).toHaveProperty('packageProducts');
        });
      });

      it('should return empty array when no packages exist', async () => {
        // Arrange - Database is empty (cleaned in afterEach)

        // Act
        const result = await service.findAll();

        // Assert
        expect(result).toBeDefined();
        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBe(0);
      });

      it('should return packages transformed to PackageResponseDto', async () => {
        // Arrange
        const brand = await brandFactory.create();
        const packageEntity = await packageFactory.createForBrand(brand);

        // Act
        const result = await service.findAll();

        // Assert
        const foundPackage = result.find((p) => p.id === packageEntity.id);
        expect(foundPackage).toBeDefined();
        expect(foundPackage).toHaveProperty('id');
        expect(foundPackage).toHaveProperty('code');
        expect(foundPackage).toHaveProperty('name');
        expect(foundPackage).toHaveProperty('status');
        expect(foundPackage).toHaveProperty('brand');
        expect(foundPackage).toHaveProperty('packageProducts');
      });
    });
  });

  describe('findWithFilters', () => {
    describe('Happy Path - Filtering by brandId', () => {
      it('should return packages filtered by brandId', async () => {
        // Arrange
        const brand1 = await brandFactory.create();
        const brand2 = await brandFactory.create();
        const package1 = await packageFactory.createForBrand(brand1);
        const package2 = await packageFactory.createForBrand(brand1);
        await packageFactory.createForBrand(brand2); // Different brand

        const filters: FindPackagesQueryDto = {
          brandId: brand1.id.toString(),
        };

        // Act
        const result = await service.findWithFilters(filters);

        // Assert
        expect(result).toBeDefined();
        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBeGreaterThanOrEqual(2);
        result.forEach((pkg) => {
          expect(pkg.brand.id).toBe(brand1.id);
        });
        const resultIds = result.map((p) => p.id);
        expect(resultIds).toContain(package1.id);
        expect(resultIds).toContain(package2.id);
      });

      it('should return empty array when no packages match brandId filter', async () => {
        // Arrange
        const brand = await brandFactory.create();
        const filters: FindPackagesQueryDto = {
          brandId: brand.id.toString(),
        };

        // Act
        const result = await service.findWithFilters(filters);

        // Assert
        expect(result).toBeDefined();
        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBe(0);
      });
    });

    describe('Edge Cases - Empty Filters', () => {
      it('should return all packages when no filters provided', async () => {
        // Arrange
        const brand = await brandFactory.create();
        const package1 = await packageFactory.createForBrand(brand);
        const package2 = await packageFactory.createForBrand(brand);

        const filters: FindPackagesQueryDto = {};

        // Act
        const result = await service.findWithFilters(filters);

        // Assert
        expect(result).toBeDefined();
        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBeGreaterThanOrEqual(2);
        const resultIds = result.map((p) => p.id);
        expect(resultIds).toContain(package1.id);
        expect(resultIds).toContain(package2.id);
      });
    });

    describe('Error Handling', () => {
      it('should throw BadRequestException when database query fails', async () => {
        // Arrange
        const filters: FindPackagesQueryDto = {};
        jest
          .spyOn(packagesRepository, 'find')
          .mockRejectedValueOnce(new Error('Database error'));

        // Act & Assert
        await expect(service.findWithFilters(filters)).rejects.toThrow(
          BadRequestException,
        );
        await expect(service.findWithFilters(filters)).rejects.toThrow(
          'Database error',
        );
      });
    });
  });

  describe('findOne', () => {
    describe('Happy Path - Package Found', () => {
      it('should return a package when id exists', async () => {
        // Arrange
        const brand = await brandFactory.create();
        const packageEntity = await packageFactory.createForBrand(brand);

        // Act
        const result = await service.findOne(packageEntity.id);

        // Assert
        expect(result).toBeDefined();
        expect(result?.id).toBe(packageEntity.id);
        expect(result?.code).toBe(packageEntity.code);
        expect(result?.name).toBe(packageEntity.name);
        expect(result?.status).toBe(packageEntity.status);
        expect(result?.brandId).toBe(packageEntity.brandId);
      });

      it('should return package with all relations loaded', async () => {
        // Arrange
        const brand = await brandFactory.create();
        const packageEntity = await packageFactory.createForBrand(brand);

        // Act
        const result = await service.findOne(packageEntity.id);

        // Assert
        expect(result).toBeDefined();
        expect(result?.brand).toBeDefined();
        expect(result?.packageProducts).toBeDefined();
        expect(Array.isArray(result?.packageProducts)).toBe(true);
      });
    });

    describe('Edge Cases - Package Not Found', () => {
      it('should return null when package does not exist', async () => {
        // Arrange
        const nonExistentId = 99999;

        // Act
        const result = await service.findOne(nonExistentId);

        // Assert
        expect(result).toBeNull();
      });

      it('should return null when id is 0', async () => {
        // Arrange
        const invalidId = 0;

        // Act
        const result = await service.findOne(invalidId);

        // Assert
        expect(result).toBeNull();
      });

      it('should return null when id is negative', async () => {
        // Arrange
        const invalidId = -1;

        // Act
        const result = await service.findOne(invalidId);

        // Assert
        expect(result).toBeNull();
      });
    });

    describe('Error Handling', () => {
      it('should throw error when database query fails', async () => {
        // Arrange
        const packageId = 1;
        jest
          .spyOn(packagesRepository, 'findOne')
          .mockRejectedValueOnce(new Error('Database error'));

        // Act & Assert
        await expect(service.findOne(packageId)).rejects.toThrow(
          'Database error',
        );
      });
    });
  });

  describe('update', () => {
    describe('Happy Path - Package Update', () => {
      it('should update package successfully with all fields', async () => {
        // Arrange
        const brand = await brandFactory.create();
        const packageEntity = await packageFactory.createForBrand(brand);
        const updatePackageDto: UpdatePackageDto = {
          name: 'Updated Package Name',
          description: 'Updated Description',
          basePrice: 1999.99,
          discount: 20,
          status: PACKAGE_STATUS.ACTIVE,
        };

        // Act
        const result = await service.update(packageEntity.id, updatePackageDto);

        // Assert
        expect(result).toBeDefined();
        expect(result.affected).toBe(1);

        // Verify the update
        const updatedPackage = await packagesRepository.findOne({
          where: { id: packageEntity.id },
        });
        expect(updatedPackage).toBeDefined();
        expect(updatedPackage?.name).toBe(updatePackageDto.name);
        expect(updatedPackage?.description).toBe(updatePackageDto.description);
        expect(updatedPackage?.basePrice).toBe(updatePackageDto.basePrice);
        expect(updatedPackage?.discount).toBe(updatePackageDto.discount);
        expect(updatedPackage?.status).toBe(updatePackageDto.status);
      });

      it('should update package with partial fields', async () => {
        // Arrange
        const brand = await brandFactory.create();
        const packageEntity = await packageFactory.createForBrand(brand);
        const updatePackageDto: UpdatePackageDto = {
          name: 'Partially Updated Package',
        };

        // Act
        const result = await service.update(packageEntity.id, updatePackageDto);

        // Assert
        expect(result).toBeDefined();
        expect(result.affected).toBe(1);

        // Verify the update
        const updatedPackage = await packagesRepository.findOne({
          where: { id: packageEntity.id },
        });
        expect(updatedPackage).toBeDefined();
        expect(updatedPackage?.name).toBe(updatePackageDto.name);
        // Other fields should remain unchanged
        expect(updatedPackage?.status).toBe(packageEntity.status);
      });

      it('should update package status only', async () => {
        // Arrange
        const brand = await brandFactory.create();
        const packageEntity = await packageFactory.createForBrand(brand, {
          status: PACKAGE_STATUS.DRAFT,
        });
        const updatePackageDto: UpdatePackageDto = {
          status: PACKAGE_STATUS.ACTIVE,
        };

        // Act
        const result = await service.update(packageEntity.id, updatePackageDto);

        // Assert
        expect(result).toBeDefined();
        expect(result.affected).toBe(1);

        // Verify the update
        const updatedPackage = await packagesRepository.findOne({
          where: { id: packageEntity.id },
        });
        expect(updatedPackage).toBeDefined();
        expect(updatedPackage?.status).toBe(PACKAGE_STATUS.ACTIVE);
      });
    });

    describe('Edge Cases - Update Non-Existent Package', () => {
      it('should return affected 0 when package does not exist', async () => {
        // Arrange
        const nonExistentId = 99999;
        const updatePackageDto: UpdatePackageDto = {
          name: 'Updated Name',
        };

        // Act
        const result = await service.update(nonExistentId, updatePackageDto);

        // Assert
        expect(result).toBeDefined();
        expect(result.affected).toBe(0);
      });
    });

    describe('Error Handling', () => {
      it('should throw error when database update fails', async () => {
        // Arrange
        const packageId = 1;
        const updatePackageDto: UpdatePackageDto = {
          name: 'Updated Name',
        };
        jest
          .spyOn(packagesRepository, 'update')
          .mockRejectedValueOnce(new Error('Database error'));

        // Act & Assert
        await expect(
          service.update(packageId, updatePackageDto),
        ).rejects.toThrow('Database error');
      });
    });
  });

  describe('addProductsToPackage', () => {
    describe('Happy Path - Adding Products', () => {
      it('should add products to package successfully', async () => {
        // Arrange
        const brand = await brandFactory.create();
        const packageEntity = await packageFactory.createForBrand(brand);
        const product1 = await productFactory.createForBrand(brand);
        const product2 = await productFactory.createForBrand(brand);

        const addProductsDto: AddProductsToPackageDto = {
          products: [
            { productId: product1.id, quantity: 2 },
            { productId: product2.id, quantity: 3 },
          ],
        };

        // Act
        const result = await service.addProductsToPackage(
          packageEntity.id,
          addProductsDto,
        );

        // Assert
        expect(result).toBeDefined();
        expect(result.message).toBe('Products added to package successfully');

        // Verify products were added
        const packageProducts = await packageProductsRepository.find({
          where: { packageId: packageEntity.id },
        });
        expect(packageProducts.length).toBe(2);
        expect(
          packageProducts.some(
            (pp) => pp.productId === product1.id && pp.quantity === 2,
          ),
        ).toBe(true);
        expect(
          packageProducts.some(
            (pp) => pp.productId === product2.id && pp.quantity === 3,
          ),
        ).toBe(true);
      });

      it('should replace existing products when adding new ones', async () => {
        // Arrange
        const brand = await brandFactory.create();
        const packageEntity = await packageFactory.createForBrand(brand);
        const product1 = await productFactory.createForBrand(brand);
        const product2 = await productFactory.createForBrand(brand);
        const product3 = await productFactory.createForBrand(brand);

        // Add initial products
        const initialDto: AddProductsToPackageDto = {
          products: [
            { productId: product1.id, quantity: 1 },
            { productId: product2.id, quantity: 2 },
          ],
        };
        await service.addProductsToPackage(packageEntity.id, initialDto);

        // Replace with new products
        const replaceDto: AddProductsToPackageDto = {
          products: [{ productId: product3.id, quantity: 5 }],
        };

        // Act
        const result = await service.addProductsToPackage(
          packageEntity.id,
          replaceDto,
        );

        // Assert
        expect(result).toBeDefined();
        expect(result.message).toBe('Products added to package successfully');

        // Verify old products were removed and new ones added
        const packageProducts = await packageProductsRepository.find({
          where: { packageId: packageEntity.id },
        });
        expect(packageProducts.length).toBe(1);
        expect(packageProducts[0].productId).toBe(product3.id);
        expect(packageProducts[0].quantity).toBe(5);
      });

      it('should add single product to package', async () => {
        // Arrange
        const brand = await brandFactory.create();
        const packageEntity = await packageFactory.createForBrand(brand);
        const product = await productFactory.createForBrand(brand);

        const addProductsDto: AddProductsToPackageDto = {
          products: [{ productId: product.id, quantity: 1 }],
        };

        // Act
        const result = await service.addProductsToPackage(
          packageEntity.id,
          addProductsDto,
        );

        // Assert
        expect(result).toBeDefined();
        expect(result.message).toBe('Products added to package successfully');

        // Verify product was added
        const packageProducts = await packageProductsRepository.find({
          where: { packageId: packageEntity.id },
        });
        expect(packageProducts.length).toBe(1);
        expect(packageProducts[0].productId).toBe(product.id);
        expect(packageProducts[0].quantity).toBe(1);
      });

      it('should handle different quantity values', async () => {
        // Arrange
        const brand = await brandFactory.create();
        const packageEntity = await packageFactory.createForBrand(brand);
        const product1 = await productFactory.createForBrand(brand);
        const product2 = await productFactory.createForBrand(brand);

        const addProductsDto: AddProductsToPackageDto = {
          products: [
            { productId: product1.id, quantity: 1 }, // Minimum
            { productId: product2.id, quantity: 100 }, // Large quantity
          ],
        };

        // Act
        const result = await service.addProductsToPackage(
          packageEntity.id,
          addProductsDto,
        );

        // Assert
        expect(result).toBeDefined();
        const packageProducts = await packageProductsRepository.find({
          where: { packageId: packageEntity.id },
        });
        expect(packageProducts.length).toBe(2);
        expect(
          packageProducts.find((pp) => pp.productId === product1.id)?.quantity,
        ).toBe(1);
        expect(
          packageProducts.find((pp) => pp.productId === product2.id)?.quantity,
        ).toBe(100);
      });
    });

    describe('Negative Testing - Package Not Found', () => {
      it('should throw NotFoundException when package does not exist', async () => {
        // Arrange
        const nonExistentId = 99999;
        const addProductsDto: AddProductsToPackageDto = {
          products: [{ productId: 1, quantity: 1 }],
        };

        // Act & Assert
        await expect(
          service.addProductsToPackage(nonExistentId, addProductsDto),
        ).rejects.toThrow(NotFoundException);
        await expect(
          service.addProductsToPackage(nonExistentId, addProductsDto),
        ).rejects.toThrow(EXCEPTION_RESPONSE.PACKAGE_NOT_FOUND.message);
      });
    });

    describe('Edge Cases - Empty Products Array', () => {
      it('should handle empty products array (clears all products)', async () => {
        // Arrange
        const brand = await brandFactory.create();
        const packageEntity = await packageFactory.createForBrand(brand);
        const product = await productFactory.createForBrand(brand);

        // Add initial product
        const initialDto: AddProductsToPackageDto = {
          products: [{ productId: product.id, quantity: 1 }],
        };
        await service.addProductsToPackage(packageEntity.id, initialDto);

        // Clear products
        const emptyDto: AddProductsToPackageDto = {
          products: [],
        };

        // Act
        const result = await service.addProductsToPackage(
          packageEntity.id,
          emptyDto,
        );

        // Assert
        expect(result).toBeDefined();
        expect(result.message).toBe('Products added to package successfully');

        // Verify all products were removed
        const packageProducts = await packageProductsRepository.find({
          where: { packageId: packageEntity.id },
        });
        expect(packageProducts.length).toBe(0);
      });
    });

    describe('Error Handling', () => {
      it('should throw error when package lookup fails', async () => {
        // Arrange
        const packageId = 1;
        const addProductsDto: AddProductsToPackageDto = {
          products: [{ productId: 1, quantity: 1 }],
        };
        jest
          .spyOn(packagesRepository, 'findOne')
          .mockRejectedValueOnce(new Error('Database error'));

        // Act & Assert
        await expect(
          service.addProductsToPackage(packageId, addProductsDto),
        ).rejects.toThrow('Database error');
      });

      it('should throw error when deleting existing products fails', async () => {
        // Arrange
        const brand = await brandFactory.create();
        const packageEntity = await packageFactory.createForBrand(brand);
        const addProductsDto: AddProductsToPackageDto = {
          products: [{ productId: 1, quantity: 1 }],
        };
        jest
          .spyOn(packageProductsRepository, 'delete')
          .mockRejectedValueOnce(new Error('Database error'));

        // Act & Assert
        await expect(
          service.addProductsToPackage(packageEntity.id, addProductsDto),
        ).rejects.toThrow('Database error');
      });

      it('should throw error when saving new products fails', async () => {
        // Arrange
        const brand = await brandFactory.create();
        const packageEntity = await packageFactory.createForBrand(brand);
        const product = await productFactory.createForBrand(brand);
        const addProductsDto: AddProductsToPackageDto = {
          products: [{ productId: product.id, quantity: 1 }],
        };
        jest
          .spyOn(packageProductsRepository, 'save')
          .mockRejectedValueOnce(new Error('Database error'));

        // Act & Assert
        await expect(
          service.addProductsToPackage(packageEntity.id, addProductsDto),
        ).rejects.toThrow('Database error');
      });
    });
  });

  describe('remove', () => {
    it('should return a string message', () => {
      // Arrange
      const packageId = 1;

      // Act
      const result = service.remove(packageId);

      // Assert
      expect(result).toBe(`This action removes a #${packageId} package`);
    });
  });
});
