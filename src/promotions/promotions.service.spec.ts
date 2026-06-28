import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';

import { AppDataSource as TestDataSource } from '../config/database/data-source';
import { BrandFactory } from '../../test/factories/brands/brands.factories';
import { PackageFactory } from '../../test/factories/packages/package.factory';
import { PromotionFactory } from '../../test/factories/promotions/promotion.factory';
import { PromotionPackageFactory } from '../../test/factories/promotions/promotion-package.factory';
import { PromotionsService } from './promotions.service';
import { PromotionPackage } from './entities/promotion-package.entity';
import {
  Promotion,
  PROMOTION_STATUS,
  PROMOTION_TYPE,
} from './entities/promotion.entity';

describe('PromotionsService', () => {
  let service: PromotionsService;
  let promotionsRepo: Repository<Promotion>;
  let promotionPackagesRepo: Repository<PromotionPackage>;
  let brandFactory: BrandFactory;
  let packageFactory: PackageFactory;
  let promotionFactory: PromotionFactory;
  let promotionPackageFactory: PromotionPackageFactory;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PromotionsService,
        {
          provide: getRepositoryToken(Promotion),
          useValue: TestDataSource.getRepository(Promotion),
        },
        {
          provide: getRepositoryToken(PromotionPackage),
          useValue: TestDataSource.getRepository(PromotionPackage),
        },
      ],
    }).compile();

    service = module.get<PromotionsService>(PromotionsService);
    promotionsRepo = module.get<Repository<Promotion>>(
      getRepositoryToken(Promotion),
    );
    promotionPackagesRepo = module.get<Repository<PromotionPackage>>(
      getRepositoryToken(PromotionPackage),
    );

    brandFactory = new BrandFactory(TestDataSource);
    packageFactory = new PackageFactory(TestDataSource);
    promotionFactory = new PromotionFactory(TestDataSource);
    promotionPackageFactory = new PromotionPackageFactory(TestDataSource);
  });

  describe('create', () => {
    it('should create an active promotion when the brand has no active promotion yet', async () => {
      // Arrange
      const brand = await brandFactory.create();

      // Act
      const result = await service.create({
        brandId: brand.id,
        name: 'Inauguración',
        type: PROMOTION_TYPE.PERCENTAGE,
        value: 10,
      });

      // Assert
      expect(result.id).toBeDefined();
      expect(result.brandId).toBe(brand.id);
      expect(result.status).toBe(PROMOTION_STATUS.ACTIVE);
    });

    it('should throw ConflictException when the brand already has an active promotion', async () => {
      // Arrange
      const brand = await brandFactory.create();
      await promotionFactory.createForBrand(brand, {
        status: PROMOTION_STATUS.ACTIVE,
      });

      // Act + Assert
      await expect(
        service.create({
          brandId: brand.id,
          name: 'Otra promo',
          type: PROMOTION_TYPE.PERCENTAGE,
          value: 5,
        }),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('should allow creating an inactive promotion even when the brand has an active one', async () => {
      // Arrange
      const brand = await brandFactory.create();
      await promotionFactory.createForBrand(brand, {
        status: PROMOTION_STATUS.ACTIVE,
      });

      // Act
      const result = await service.create({
        brandId: brand.id,
        name: 'Borrador',
        type: PROMOTION_TYPE.PERCENTAGE,
        value: 5,
        status: PROMOTION_STATUS.INACTIVE,
      });

      // Assert
      expect(result.status).toBe(PROMOTION_STATUS.INACTIVE);
    });
  });

  describe('update', () => {
    it('should throw ConflictException when activating a promotion while another is already active for the brand', async () => {
      // Arrange
      const brand = await brandFactory.create();
      await promotionFactory.createForBrand(brand, {
        status: PROMOTION_STATUS.ACTIVE,
      });
      const inactive = await promotionFactory.createForBrand(brand, {
        status: PROMOTION_STATUS.INACTIVE,
      });

      // Act + Assert
      await expect(
        service.update(inactive.id, { status: PROMOTION_STATUS.ACTIVE }),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('should allow activating a promotion when no other active promotion exists for the brand', async () => {
      // Arrange
      const brand = await brandFactory.create();
      const inactive = await promotionFactory.createForBrand(brand, {
        status: PROMOTION_STATUS.INACTIVE,
      });

      // Act
      await service.update(inactive.id, { status: PROMOTION_STATUS.ACTIVE });

      // Assert
      const updated = await promotionsRepo.findOneBy({ id: inactive.id });
      expect(updated?.status).toBe(PROMOTION_STATUS.ACTIVE);
    });

    it('should throw NotFoundException when the promotion does not exist', async () => {
      // Arrange — non-existent id

      // Act + Assert
      await expect(
        service.update(999999, { name: 'x' }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('setPackages', () => {
    it('should replace previous tiers with the ones in the payload', async () => {
      // Arrange
      const brand = await brandFactory.create();
      const promotion = await promotionFactory.createForBrand(brand);
      const pkg = await packageFactory.createForBrand(brand);
      await promotionPackageFactory.createTier(promotion, pkg, 1, 100);

      // Act
      await service.setPackages(promotion.id, {
        packages: [
          {
            packageId: pkg.id,
            tiers: [
              { order: 1, discountPercentage: 100 },
              { order: 2, discountPercentage: 50 },
            ],
          },
        ],
      });

      // Assert
      const rows = await promotionPackagesRepo.find({
        where: { promotionId: promotion.id },
        order: { tierOrder: 'ASC' },
      });
      expect(rows).toHaveLength(2);
      expect(rows[0]?.discountPercentage).toBe(100);
      expect(rows[1]?.discountPercentage).toBe(50);
    });

    it('should throw BadRequestException when the payload has a duplicate tier order for the same package', async () => {
      // Arrange
      const brand = await brandFactory.create();
      const promotion = await promotionFactory.createForBrand(brand);
      const pkg = await packageFactory.createForBrand(brand);

      // Act + Assert
      await expect(
        service.setPackages(promotion.id, {
          packages: [
            {
              packageId: pkg.id,
              tiers: [
                { order: 1, discountPercentage: 100 },
                { order: 1, discountPercentage: 50 },
              ],
            },
          ],
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('should throw NotFoundException when the promotion does not exist', async () => {
      // Arrange — non-existent id

      // Act + Assert
      await expect(
        service.setPackages(999999, { packages: [] }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('getActiveTierMapForBrand', () => {
    it('should return tiers grouped by package for the brand active promotion', async () => {
      // Arrange
      const brand = await brandFactory.create();
      const promotion = await promotionFactory.createForBrand(brand, {
        status: PROMOTION_STATUS.ACTIVE,
      });
      const basico = await packageFactory.createForBrand(brand);
      const plus = await packageFactory.createForBrand(brand);
      await promotionPackageFactory.createTier(promotion, basico, 1, 100);
      await promotionPackageFactory.createTier(promotion, basico, 2, 50);
      await promotionPackageFactory.createTier(promotion, plus, 1, 100);
      await promotionPackageFactory.createTier(promotion, plus, 2, 100);

      // Act
      const map = await service.getActiveTierMapForBrand(brand.id, [
        basico.id,
        plus.id,
      ]);

      // Assert
      expect(map.get(basico.id)?.tiers).toEqual([
        { order: 1, discountPercentage: 100 },
        { order: 2, discountPercentage: 50 },
      ]);
      expect(map.get(plus.id)?.tiers).toEqual([
        { order: 1, discountPercentage: 100 },
        { order: 2, discountPercentage: 100 },
      ]);
      expect(map.get(basico.id)?.promotionId).toBe(promotion.id);
    });

    it('should return an empty map when the brand has no active promotion', async () => {
      // Arrange
      const brand = await brandFactory.create();
      const pkg = await packageFactory.createForBrand(brand);

      // Act
      const map = await service.getActiveTierMapForBrand(brand.id, [pkg.id]);

      // Assert
      expect(map.size).toBe(0);
    });

    it('should return an empty map when the active promotion has not started yet', async () => {
      // Arrange
      const brand = await brandFactory.create();
      const promotion = await promotionFactory.createForBrand(brand, {
        status: PROMOTION_STATUS.ACTIVE,
        validFrom: new Date(Date.now() + 24 * 60 * 60 * 1000),
      });
      const pkg = await packageFactory.createForBrand(brand);
      await promotionPackageFactory.createTier(promotion, pkg, 1, 100);

      // Act
      const map = await service.getActiveTierMapForBrand(brand.id, [pkg.id]);

      // Assert
      expect(map.size).toBe(0);
    });

    it('should return an empty map when the active promotion already ended', async () => {
      // Arrange
      const brand = await brandFactory.create();
      const promotion = await promotionFactory.createForBrand(brand, {
        status: PROMOTION_STATUS.ACTIVE,
        validUntil: new Date(Date.now() - 24 * 60 * 60 * 1000),
      });
      const pkg = await packageFactory.createForBrand(brand);
      await promotionPackageFactory.createTier(promotion, pkg, 1, 100);

      // Act
      const map = await service.getActiveTierMapForBrand(brand.id, [pkg.id]);

      // Assert
      expect(map.size).toBe(0);
    });
  });

  describe('findAll', () => {
    it('should expose nested packages and tiers for display purposes', async () => {
      // Arrange
      const brand = await brandFactory.create();
      const promotion = await promotionFactory.createForBrand(brand, {
        status: PROMOTION_STATUS.ACTIVE,
      });
      const pkg = await packageFactory.createForBrand(brand);
      await promotionPackageFactory.createTier(promotion, pkg, 1, 100);
      await promotionPackageFactory.createTier(promotion, pkg, 2, 50);

      // Act
      const result = await service.findAll({
        brandId: String(brand.id),
        status: PROMOTION_STATUS.ACTIVE,
      });

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0]?.packages).toHaveLength(1);
      expect(result[0]?.packages?.[0]?.tiers).toEqual([
        { order: 1, discountPercentage: 100 },
        { order: 2, discountPercentage: 50 },
      ]);
    });
  });
});
