import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';
import { DataSource } from 'typeorm';

import { AppDataSource as TestDataSource } from '../config/database/data-source';
import { BrandFactory } from '../../test/factories/brands/brands.factories';
import { PackageFactory } from '../../test/factories/packages/package.factory';
import { SlotFactory } from '../../test/factories/slots/slot.factory';
import { ContractsService } from './contracts.service';
import { AddItemDto } from './dto/add-item.dto';
import { CreateContractFromSlotsDto } from './dto/create-contract-from-slots.dto';
import { Contract } from './entities/contract.entity';
import { ContractPackage } from './entities/contract-package.entity';
import { Payment } from './entities/payment.entity';
import { CONTRACT_PACKAGE_SOURCE } from './types/contract-package-source.types';
import { CONTRACT_STATUS } from './types/contract-status.types';
import { PAYMENT_METHOD } from './types/payment-method.types';
import { Package } from '../packages/entities/package.entity';
import { Slot } from '../slots/entities/slot.entity';
import { SLOT_PERIOD } from '../slots/types/slot-period.types';
import { SLOT_STATUS } from '../slots/types/slot-status.types';
import { User } from '../users/entities/user.entity';

describe('ContractsService', () => {
  let service: ContractsService;
  let contractsRepo: Repository<Contract>;
  let slotsRepo: Repository<Slot>;
  let contractPackagesRepo: Repository<ContractPackage>;
  let paymentsRepo: Repository<Payment>;
  let packageFactory: PackageFactory;
  let brandFactory: BrandFactory;
  let slotFactory: SlotFactory;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContractsService,
        { provide: DataSource, useValue: TestDataSource },
        {
          provide: getRepositoryToken(Contract),
          useValue: TestDataSource.getRepository(Contract),
        },
        {
          provide: getRepositoryToken(Slot),
          useValue: TestDataSource.getRepository(Slot),
        },
        {
          provide: getRepositoryToken(ContractPackage),
          useValue: TestDataSource.getRepository(ContractPackage),
        },
        {
          provide: getRepositoryToken(Payment),
          useValue: TestDataSource.getRepository(Payment),
        },
        {
          provide: getRepositoryToken(Package),
          useValue: TestDataSource.getRepository(Package),
        },
        {
          provide: getRepositoryToken(User),
          useValue: TestDataSource.getRepository(User),
        },
      ],
    }).compile();

    service = module.get<ContractsService>(ContractsService);
    contractsRepo = module.get<Repository<Contract>>(
      getRepositoryToken(Contract),
    );
    slotsRepo = module.get<Repository<Slot>>(getRepositoryToken(Slot));
    contractPackagesRepo = module.get<Repository<ContractPackage>>(
      getRepositoryToken(ContractPackage),
    );
    paymentsRepo = module.get<Repository<Payment>>(getRepositoryToken(Payment));

    packageFactory = new PackageFactory(TestDataSource);
    brandFactory = new BrandFactory(TestDataSource);
    slotFactory = new SlotFactory(TestDataSource);
  });

  describe('createContract', () => {
    it('should create an active contract, save items, and persist totalAmount', async () => {
      const brand = await brandFactory.create();
      const pkg = await packageFactory.createForBrand(brand, {
        basePrice: 100,
        discount: 10,
      });
      const slot = await slotFactory.create({
        status: SLOT_STATUS.HELD,
        contractId: null,
      });

      const packages: AddItemDto[] = [{ packageId: pkg.id, quantity: 2 }];
      const dto: CreateContractFromSlotsDto = { slotId: slot.id, packages };

      const result = await service.createContract(dto);

      expect(result.id).toBeDefined();
      expect(result.status).toBe(CONTRACT_STATUS.ACTIVE);
      expect(typeof result.token).toBe('string');
      expect(result.token.length).toBeGreaterThan(0);

      const saved = await contractsRepo.findOne({ where: { id: result.id } });
      expect(saved).not.toBeNull();
      const expectedUnitPrice = 100 * (1 - 10 / 100);
      expect(saved?.totalAmount).toBeCloseTo(expectedUnitPrice * 2);

      const savedItems = await contractPackagesRepo.find({
        where: { contractId: result.id },
      });
      expect(savedItems).toHaveLength(1);
      expect(savedItems[0]?.packageId).toBe(pkg.id);
      expect(savedItems[0]?.quantity).toBe(2);
      expect(savedItems[0]?.source).toBe(CONTRACT_PACKAGE_SOURCE.PACKAGE);

      const unchangedSlot = await slotsRepo.findOne({ where: { id: slot.id } });
      expect(unchangedSlot?.contractId).toBeNull();
      expect(unchangedSlot?.status).toBe(SLOT_STATUS.HELD);
    });

    it('should throw if slot is not found', async () => {
      const dto: CreateContractFromSlotsDto = { slotId: 999999, packages: [] };
      await expect(service.createContract(dto)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('should throw if slot is not held', async () => {
      const slot = await slotFactory.create({
        status: SLOT_STATUS.BOOKED,
        contractId: null,
      });
      const dto: CreateContractFromSlotsDto = { slotId: slot.id, packages: [] };
      await expect(service.createContract(dto)).rejects.toBeInstanceOf(
        ConflictException,
      );
    });

    it('should throw if slot is already booked (has contractId)', async () => {
      const slot = await slotFactory.create({
        status: SLOT_STATUS.HELD,
        contractId: 123,
      });
      const dto: CreateContractFromSlotsDto = { slotId: slot.id, packages: [] };
      await expect(service.createContract(dto)).rejects.toBeInstanceOf(
        ConflictException,
      );
    });
  });

  describe('getDetail', () => {
    it('should throw if contract is not found', async () => {
      await expect(service.getDetail(999999)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('should return contract, slots, items, payments, and paidAmount', async () => {
      const contract = await contractsRepo.save(
        contractsRepo.create({
          status: CONTRACT_STATUS.ACTIVE,
          totalAmount: 0,
          token: 'test-token',
        }),
      );

      const slot1 = await slotFactory.create({
        eventDate: '2030-01-01',
        period: SLOT_PERIOD.MORNING,
        status: SLOT_STATUS.BOOKED,
        contractId: contract.id,
      });
      const slot2 = await slotFactory.create({
        eventDate: '2030-01-02',
        period: SLOT_PERIOD.MORNING,
        status: SLOT_STATUS.BOOKED,
        contractId: contract.id,
      });

      const brand = await brandFactory.create();
      const pkg = await packageFactory.createForBrand(brand, {
        basePrice: 50,
        discount: 0,
      });
      await contractPackagesRepo.save(
        contractPackagesRepo.create({
          contractId: contract.id,
          packageId: pkg.id,
          quantity: 3,
          source: CONTRACT_PACKAGE_SOURCE.PACKAGE,
        }),
      );

      const payment1 = await paymentsRepo.save(
        paymentsRepo.create({
          contractId: contract.id,
          amount: 40,
          method: PAYMENT_METHOD.CASH,
          receivedAt: new Date('2030-01-01T10:00:00.000Z'),
          note: null,
        }),
      );
      const payment2 = await paymentsRepo.save(
        paymentsRepo.create({
          contractId: contract.id,
          amount: 60,
          method: PAYMENT_METHOD.CARD,
          receivedAt: new Date('2030-01-01T11:00:00.000Z'),
          note: 'partial',
        }),
      );

      const detail = await service.getDetail(contract.id);

      expect(detail.contract.id).toBe(contract.id);
      expect(detail.contract.status).toBe(CONTRACT_STATUS.ACTIVE);
      expect(detail.contract.token).toBe('test-token');

      const slotIds = detail.slots.map((s) => s.id).sort((a, b) => a - b);
      expect(slotIds).toEqual([slot1.id, slot2.id].sort((a, b) => a - b));

      expect(detail.items).toHaveLength(1);
      expect(detail.items[0]?.contractId).toBe(contract.id);
      expect(detail.items[0]?.packageId).toBe(pkg.id);
      expect(detail.items[0]?.quantity).toBe(3);

      const paymentIds = detail.payments.map((p) => p.id).sort((a, b) => a - b);
      expect(paymentIds).toEqual(
        [payment1.id, payment2.id].sort((a, b) => a - b),
      );
      expect(detail.paidAmount).toBeCloseTo(100);
    });
  });
});
