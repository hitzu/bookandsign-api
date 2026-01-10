import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BrandsService } from './brands.service';
import { Brand } from './entities/brand.entity';
import { CreateBrandDto } from './dto/create-brand.dto';
import { AppDataSource as TestDataSource } from '../config/database/data-source';
import { BrandFactory } from '@factories/brands/brands.factories';

describe('BrandsService', () => {
  let service: BrandsService;
  let repository: Repository<Brand>;
  let brandFactory: BrandFactory;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BrandsService,
        {
          provide: getRepositoryToken(Brand),
          useValue: TestDataSource.getRepository(Brand),
        },
      ],
    }).compile();

    service = module.get<BrandsService>(BrandsService);
    repository = module.get<Repository<Brand>>(getRepositoryToken(Brand));
    brandFactory = new BrandFactory(TestDataSource);
  });

  describe('create', () => {
    describe('Happy Path - Valid Brand Creation', () => {
      it('should create a brand with valid DTO', async () => {
        // Arrange
        const brandData = await brandFactory.make();
        const createBrandDto: CreateBrandDto = {
          name: brandData.name,
        };

        // Act
        const result = await service.create(createBrandDto);

        // Assert
        expect(result).toBeDefined();
        expect(result.id).toBeDefined();
        expect(result.name).toBe(createBrandDto.name);
        expect(result.createdAt).toBeDefined();
        expect(result.updatedAt).toBeDefined();
      });
    });

    describe('State-Based Testing - Database Persistence', () => {
      it('should persist brand to database', async () => {
        // Arrange
        const brandData = await brandFactory.make({
          name: 'Persistent Brand',
        });
        const createBrandDto: CreateBrandDto = {
          name: brandData.name,
          logoUrl: brandData.logoUrl,
          phoneNumber: brandData.phoneNumber,
          email: brandData.email,
        };

        // Act
        const createdBrand = await service.create(createBrandDto);
        const foundBrand = await repository.findOne({
          where: { id: createdBrand.id },
        });

        // Assert
        expect(foundBrand).toBeDefined();
        expect(foundBrand?.id).toBe(createdBrand.id);
        expect(foundBrand?.name).toBe(createBrandDto.name);
      });
    });
  });

  describe('findAll', () => {
    describe('Happy Path - Multiple Brands', () => {
      it('should return all brands when database has multiple brands', async () => {
        // Arrange
        const brand1 = await brandFactory.create({
          name: 'Lusso Brand',
        });
        const brand2 = await brandFactory.create({
          name: 'Brillipoint Brand',
        });
        const brand3 = await brandFactory.create({
          name: 'Aletvia Brand',
          phoneNumber: '+1234567890',
          email: 'aletvia@example.com',
        });

        // Act
        const result = await service.findAll();

        // Assert
        expect(result).toHaveLength(3);
        expect(result).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ id: brand1.id, name: 'Lusso Brand' }),
            expect.objectContaining({
              id: brand2.id,
              name: 'Brillipoint Brand',
            }),
            expect.objectContaining({ id: brand3.id, name: 'Aletvia Brand' }),
          ]),
        );
      });
    });

    describe('Edge Case - Empty Database', () => {
      it('should return empty array when database is empty', async () => {
        // Arrange - Database is already empty due to afterEach cleanup

        // Act
        const result = await service.findAll();

        // Assert
        expect(result).toEqual([]);
        expect(result).toHaveLength(0);
      });
    });

    describe('State-Based Testing - Data Consistency', () => {
      it('should return brands with all required properties', async () => {
        // Arrange
        await brandFactory.create({
          name: 'Test Brand',
        });

        // Act
        const result = await service.findAll();

        // Assert
        expect(result).toHaveLength(1);
        const brand = result[0];
        expect(brand).toHaveProperty('id');
        expect(brand).toHaveProperty('key');
        expect(brand).toHaveProperty('name');
        expect(brand).toHaveProperty('createdAt');
        expect(brand).toHaveProperty('updatedAt');
        expect(brand).toHaveProperty('deletedAt');
      });
    });
  });

  describe('Integration Tests - Service + Repository', () => {
    it('should create and then find all brands', async () => {
      // Arrange
      const brandData = await brandFactory.make({
        name: 'Integration Test Brand',
      });
      const createBrandDto: CreateBrandDto = {
        name: brandData.name,
        logoUrl: brandData.logoUrl,
        phoneNumber: brandData.phoneNumber,
        email: brandData.email,
      };

      // Act
      const createdBrand = await service.create(createBrandDto);
      const allBrands = await service.findAll();

      // Assert
      expect(allBrands).toHaveLength(1);
      expect(allBrands[0]).toEqual(createdBrand);
    });
  });
});
