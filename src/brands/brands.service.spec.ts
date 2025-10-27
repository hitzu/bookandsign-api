import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BrandsService } from './brands.service';
import { Brand } from './entities/brand.entity';
import { CreateBrandDto } from './dto/create-brand.dto';
import { BrandKey } from './brands.constants';
import { TestDataSource } from '../config/database/test-data-source';
import { BrandFactory } from './entities/brand.factory';

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
        const createBrandDto: CreateBrandDto = {
          key: BrandKey.LUSSO,
          name: 'Lusso Brand',
          logo_url: 'https://example.com/logo.png',
          theme: {
            primaryColor: '#1a1a1a',
            secondaryColor: '#f5f5f5',
          },
        };

        // Act
        const result = await service.create(createBrandDto);

        // Assert
        expect(result).toBeDefined();
        expect(result.id).toBeDefined();
        expect(result.key).toBe(createBrandDto.key);
        expect(result.name).toBe(createBrandDto.name);
        expect(result.theme).toEqual(createBrandDto.theme);
        expect(result.createdAt).toBeDefined();
        expect(result.updatedAt).toBeDefined();
      });

      it('should create a brand with complex theme object', async () => {
        // Arrange
        const createBrandDto: CreateBrandDto = {
          key: BrandKey.BRILLIPOINT,
          name: 'Brillipoint Brand',
          logo_url: 'https://cdn.example.com/brillipoint-logo.svg',
          theme: {
            primaryColor: '#0066cc',
            secondaryColor: '#ffffff',
            accentColor: '#ff6b35',
            fontFamily: 'Inter',
            borderRadius: '8px',
            spacing: {
              small: '8px',
              medium: '16px',
              large: '24px',
            },
          },
        };

        // Act
        const result = await service.create(createBrandDto);

        // Assert
        expect(result).toBeDefined();
        expect(result.theme).toEqual(createBrandDto.theme);
        expect(result.theme.spacing).toBeDefined();
        expect((result.theme.spacing as Record<string, string>).small).toBe(
          '8px',
        );
      });
    });

    describe('Boundary Value Analysis - Theme Variations', () => {
      it('should create a brand with empty theme object', async () => {
        // Arrange
        const createBrandDto: CreateBrandDto = {
          key: BrandKey.ALETVIA,
          name: 'Aletvia Brand',
          logo_url: 'https://example.com/aletvia.png',
          theme: {},
        };

        // Act
        const result = await service.create(createBrandDto);

        // Assert
        expect(result).toBeDefined();
        expect(result.theme).toEqual({});
      });

      it('should create a brand with minimal theme properties', async () => {
        // Arrange
        const createBrandDto: CreateBrandDto = {
          key: BrandKey.LUSSO,
          name: 'Minimal Brand',
          logo_url: 'https://example.com/minimal.png',
          theme: {
            color: '#000000',
          },
        };

        // Act
        const result = await service.create(createBrandDto);

        // Assert
        expect(result).toBeDefined();
        expect(result.theme).toEqual({ color: '#000000' });
      });
    });

    describe('Parameterized Testing - All Brand Keys', () => {
      const brandKeys = Object.values(BrandKey);

      it.each(brandKeys)(
        'should create a brand with key: %s',
        async (brandKey) => {
          // Arrange
          const createBrandDto: CreateBrandDto = {
            key: brandKey,
            name: `${brandKey} Brand`,
            logo_url: `https://example.com/${brandKey}.png`,
            theme: {
              primaryColor: '#000000',
            },
          };

          // Act
          const result = await service.create(createBrandDto);

          // Assert
          expect(result).toBeDefined();
          expect(result.key).toBe(brandKey);
        },
      );
    });

    describe('State-Based Testing - Database Persistence', () => {
      it('should persist brand to database', async () => {
        // Arrange
        const createBrandDto: CreateBrandDto = {
          key: BrandKey.LUSSO,
          name: 'Persistent Brand',
          logo_url: 'https://example.com/persistent.png',
          theme: { primaryColor: '#ff0000' },
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
          key: BrandKey.LUSSO,
          name: 'Lusso Brand',
          theme: { primaryColor: '#1a1a1a' },
        });
        const brand2 = await brandFactory.create({
          key: BrandKey.BRILLIPOINT,
          name: 'Brillipoint Brand',
          theme: { primaryColor: '#0066cc' },
        });
        const brand3 = await brandFactory.create({
          key: BrandKey.ALETVIA,
          name: 'Aletvia Brand',
          theme: { primaryColor: '#2c3e50' },
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
          key: BrandKey.LUSSO,
          name: 'Test Brand',
          theme: { primaryColor: '#ff0000' },
        });

        // Act
        const result = await service.findAll();

        // Assert
        expect(result).toHaveLength(1);
        const brand = result[0];
        expect(brand).toHaveProperty('id');
        expect(brand).toHaveProperty('key');
        expect(brand).toHaveProperty('name');
        expect(brand).toHaveProperty('theme');
        expect(brand).toHaveProperty('createdAt');
        expect(brand).toHaveProperty('updatedAt');
        expect(brand).toHaveProperty('deletedAt');
      });
    });
  });

  describe('Integration Tests - Service + Repository', () => {
    it('should create and then find all brands', async () => {
      // Arrange
      const createBrandDto: CreateBrandDto = {
        key: BrandKey.LUSSO,
        name: 'Integration Test Brand',
        logo_url: 'https://example.com/integration.png',
        theme: { primaryColor: '#00ff00' },
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
