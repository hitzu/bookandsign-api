import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { AppDataSource as TestDataSource } from '../config/database/data-source';
import { BrandFactory } from '../../test/factories/brands/brands.factories';
import { CarouselFactory } from '../../test/factories/carousels/carousel.factory';
import { Carousel } from './entities/carousel.entity';
import { CarouselsService } from './carousels.service';

describe('CarouselsService', () => {
  let service: CarouselsService;
  let carouselFactory: CarouselFactory;
  let brandFactory: BrandFactory;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CarouselsService,
        {
          provide: getRepositoryToken(Carousel),
          useValue: TestDataSource.getRepository(Carousel),
        },
      ],
    }).compile();

    service = module.get<CarouselsService>(CarouselsService);
    carouselFactory = new CarouselFactory(TestDataSource);
    brandFactory = new BrandFactory(TestDataSource);
  });

  describe('findByPageSection', () => {
    it('should return active items matching page, section, and brandId', async () => {
      // Arrange
      const brand = await brandFactory.create();
      await carouselFactory.create({
        page: 'expo-bebe',
        section: 'services',
        brandId: brand.id,
        status: 'active',
      });

      // Act
      const result = await service.findByPageSection('expo-bebe', 'services', brand.id);

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0]?.brandId).toBe(brand.id);
    });

    it('should return items with null brandId when no brandId is provided', async () => {
      // Arrange
      await carouselFactory.create({
        page: 'main-page',
        section: 'general',
        brandId: null,
        status: 'active',
      });

      // Act
      const result = await service.findByPageSection('main-page', 'general', undefined);

      // Assert
      expect(result.length).toBeGreaterThanOrEqual(1);
      expect(result.every((r) => r.brandId === null)).toBe(true);
    });

    it('should not return items from a different page or section', async () => {
      // Arrange
      const brand = await brandFactory.create();
      await carouselFactory.create({
        page: 'other-page',
        section: 'services',
        brandId: brand.id,
        status: 'active',
      });

      // Act
      const result = await service.findByPageSection('expo-bebe', 'services', brand.id);

      // Assert
      expect(result).toHaveLength(0);
    });

    it('should not return inactive items', async () => {
      // Arrange
      const brand = await brandFactory.create();
      await carouselFactory.create({
        page: 'expo-bebe',
        section: 'extras',
        brandId: brand.id,
        status: 'inactive',
      });

      // Act
      const result = await service.findByPageSection('expo-bebe', 'extras', brand.id);

      // Assert
      expect(result).toHaveLength(0);
    });

    it('should return items ordered by sortOrder ascending', async () => {
      // Arrange
      const brand = await brandFactory.create();
      await carouselFactory.create({ page: 'expo-bebe', section: 'order-test', brandId: brand.id, sortOrder: 2 });
      await carouselFactory.create({ page: 'expo-bebe', section: 'order-test', brandId: brand.id, sortOrder: 0 });
      await carouselFactory.create({ page: 'expo-bebe', section: 'order-test', brandId: brand.id, sortOrder: 1 });

      // Act
      const result = await service.findByPageSection('expo-bebe', 'order-test', brand.id);

      // Assert
      expect(result).toHaveLength(3);
      expect(result.map((r) => r.sortOrder)).toEqual([0, 1, 2]);
    });

    it('should not return items belonging to a different brand', async () => {
      // Arrange
      const brandA = await brandFactory.create();
      const brandB = await brandFactory.create();
      await carouselFactory.create({
        page: 'expo-bebe',
        section: 'services',
        brandId: brandA.id,
        status: 'active',
      });

      // Act
      const result = await service.findByPageSection('expo-bebe', 'services', brandB.id);

      // Assert
      expect(result).toHaveLength(0);
    });
  });
});
