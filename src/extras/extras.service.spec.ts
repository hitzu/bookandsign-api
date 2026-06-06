import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { BrandFactory } from '@factories/brands/brands.factories';
import { ExtraFactory } from '@factories/extras/extra.factory';
import { AppDataSource as TestDataSource } from '../config/database/data-source';
import { CreateExtraDto } from './dto/create-extra.dto';
import { FindExtrasQueryDto } from './dto/find-extras-query.dto';
import { UpdateExtraDto } from './dto/update-extra.dto';
import { Extra } from './entities/extra.entity';
import { ExtrasService } from './extras.service';
import { EXTRA_STATUS } from './types/extras-status.types';

describe('ExtrasService', () => {
  let service: ExtrasService;
  let extrasRepository: Repository<Extra>;
  let extraFactory: ExtraFactory;
  let brandFactory: BrandFactory;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExtrasService,
        {
          provide: getRepositoryToken(Extra),
          useValue: TestDataSource.getRepository(Extra),
        },
      ],
    }).compile();

    service = module.get<ExtrasService>(ExtrasService);
    extrasRepository = module.get<Repository<Extra>>(getRepositoryToken(Extra));
    extraFactory = new ExtraFactory(TestDataSource);
    brandFactory = new BrandFactory(TestDataSource);
  });

  describe('create', () => {
    it('should create an extra for a specific brand', async () => {
      const brand = await brandFactory.create();
      const dto: CreateExtraDto = {
        brandId: brand.id,
        name: 'Espejo recepción - salón',
        description: 'Extra para montaje en salón',
        price: 500,
        status: EXTRA_STATUS.ACTIVE,
      };

      const result = await service.create(dto);

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.brandId).toBe(brand.id);
      expect(result.name).toBe(dto.name);
      expect(result.description).toBe(dto.description);
      expect(result.price).toBe(dto.price);
      expect(result.status).toBe(EXTRA_STATUS.ACTIVE);
    });

    it('should default status to active when omitted', async () => {
      const brand = await brandFactory.create();
      const dto: CreateExtraDto = {
        brandId: brand.id,
        name: 'Espejo recepción',
        description: null,
        price: 800,
      };

      const result = await service.create(dto);

      expect(result.status).toBe(EXTRA_STATUS.ACTIVE);
      expect(result.description).toBeNull();
    });
  });

  describe('findAll', () => {
    it('should return all extras with their brand relation', async () => {
      const brand = await brandFactory.create();
      const extra1 = await extraFactory.createForBrand(brand);
      const extra2 = await extraFactory.createForBrand(brand);

      const result = await service.findAll();

      expect(result).toHaveLength(2);
      expect(result.map((extra) => extra.id)).toEqual(
        expect.arrayContaining([extra1.id, extra2.id]),
      );
      result.forEach((extra) => {
        expect(extra).toHaveProperty('brand');
        expect(extra.brand.id).toBe(brand.id);
      });
    });
  });

  describe('findWithFilters', () => {
    it('should return only active extras for the requested brand', async () => {
      const brandA = await brandFactory.create();
      const brandB = await brandFactory.create();
      const activeA = await extraFactory.createActive(brandA, {
        name: 'Activo A',
      });
      await extraFactory.createInactive(brandA, {
        name: 'Inactivo A',
      });
      await extraFactory.createActive(brandB, {
        name: 'Activo B',
      });

      const query: FindExtrasQueryDto = {
        brandId: String(brandA.id),
      };

      const result = await service.findWithFilters(query);

      expect(result).toHaveLength(1);
      expect(result[0]?.id).toBe(activeA.id);
      expect(result[0]?.brandId).toBe(brandA.id);
      expect(result[0]?.status).toBe(EXTRA_STATUS.ACTIVE);
    });
  });

  describe('findOne', () => {
    it('should return one extra with brand relation', async () => {
      const brand = await brandFactory.create();
      const extra = await extraFactory.createForBrand(brand, {
        name: 'Espejo premium',
      });

      const result = await service.findOne(extra.id);

      expect(result.id).toBe(extra.id);
      expect(result.brandId).toBe(brand.id);
      expect(result.brand.id).toBe(brand.id);
      expect(result.name).toBe('Espejo premium');
    });

    it('should throw when the extra does not exist', async () => {
      await expect(service.findOne(999999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update an existing extra', async () => {
      const brand = await brandFactory.create();
      const extra = await extraFactory.createForBrand(brand, {
        name: 'Extra original',
        price: 500,
        status: EXTRA_STATUS.ACTIVE,
      });
      const dto: UpdateExtraDto = {
        name: 'Extra actualizado',
        price: 650,
        status: EXTRA_STATUS.INACTIVE,
      };

      const result = await service.update(extra.id, dto);

      expect(result.id).toBe(extra.id);
      expect(result.name).toBe('Extra actualizado');
      expect(result.price).toBe(650);
      expect(result.status).toBe(EXTRA_STATUS.INACTIVE);
      expect(result.brandId).toBe(brand.id);
    });
  });

  describe('remove', () => {
    it('should soft delete an extra', async () => {
      const extra = await extraFactory.create();

      await service.remove(extra.id);

      const softDeleted = await extrasRepository.findOne({
        where: { id: extra.id },
        withDeleted: true,
      });
      expect(softDeleted).toBeDefined();
      expect(softDeleted?.deletedAt).not.toBeNull();

      const visible = await extrasRepository.findOne({
        where: { id: extra.id },
      });
      expect(visible).toBeNull();
    });
  });

  describe('findExtrasStatus', () => {
    it('should return all extra statuses', () => {
      expect(service.findExtrasStatus()).toEqual(
        expect.arrayContaining([
          EXTRA_STATUS.ACTIVE,
          EXTRA_STATUS.INACTIVE,
        ]),
      );
    });
  });
});
