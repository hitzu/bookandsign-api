import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';
import { DataSource } from 'typeorm';

import { AppDataSource as TestDataSource } from '../config/database/data-source';
import { BrandFactory } from '../../test/factories/brands/brands.factories';
import { PackageFactory } from '../../test/factories/packages/package.factory';
import { SlotFactory } from '../../test/factories/slots/slot.factory';
import { UserFactory } from '../../test/factories/user/user.factory';
import { PaymentsService } from '../payments/payments.service';
import { ContractsService } from './contracts.service';
import { AddItemDto } from './dto/add-item.dto';
import { CreateContractFromSlotsDto } from './dto/create-contract-from-slots.dto';
import { Contract } from './entities/contract.entity';
import { ContractPackage } from './entities/contract-package.entity';
import { Payment } from '../payments/entities/payment.entity';
import { CONTRACT_STATUS } from './types/contract-status.types';
import { PAYMENT_METHOD } from './types/payment-method.types';
import { Package } from '../packages/entities/package.entity';
import { Slot } from '../slots/entities/slot.entity';
import { SLOT_PERIOD } from '../slots/types/slot-period.types';
import { SLOT_STATUS } from '../slots/types/slot-status.types';
import { User } from '../users/entities/user.entity';
import { ContractSlot } from './entities/contract-slot.entity';

describe('ContractsService', () => {
  let service: ContractsService;
  let contractsRepo: Repository<Contract>;
  let contractPackagesRepo: Repository<ContractPackage>;
  let paymentsRepo: Repository<Payment>;
  let contractSlotsRepo: Repository<ContractSlot>;
  let slotsRepo: Repository<Slot>;
  let packageFactory: PackageFactory;
  let brandFactory: BrandFactory;
  let slotFactory: SlotFactory;
  let userFactory: UserFactory;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContractsService,
        PaymentsService,
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
          provide: getRepositoryToken(ContractSlot),
          useValue: TestDataSource.getRepository(ContractSlot),
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
    contractSlotsRepo = module.get<Repository<ContractSlot>>(
      getRepositoryToken(ContractSlot),
    );
    paymentsRepo = module.get<Repository<Payment>>(getRepositoryToken(Payment));

    packageFactory = new PackageFactory(TestDataSource);
    brandFactory = new BrandFactory(TestDataSource);
    slotFactory = new SlotFactory(TestDataSource);
    userFactory = new UserFactory(TestDataSource);
  });

  describe('createContract', () => {
    it('should create a confirmed contract, attach the legacy slot relation, create contract_slots link, and persist item snapshots/totals', async () => {
      const user = await userFactory.create();
      const brand = await brandFactory.create();
      const pkg = await packageFactory.createForBrand(brand, {
        basePrice: 100,
      });
      const slot = await slotFactory.create({
        status: SLOT_STATUS.RESERVED,
        period: SLOT_PERIOD.AM_BLOCK,
      });

      const packages: AddItemDto[] = [{ packageId: pkg.id, quantity: 2 }];
      const dto: CreateContractFromSlotsDto = {
        userId: user.id,
        slotId: slot.id,
        sku: 'SKU-TEST-001',
        clientName: 'Ana',
        clientPhone: null,
        clientEmail: null,
        subtotal: 0,
        discountTotal: 0,
        total: 200,
        packages,
      };

      const result = await service.createContract(dto);

      expect(result.id).toBeDefined();
      expect(result.status).toBe(CONTRACT_STATUS.CONFIRMED);
      expect(result.sku).toBe('SKU-TEST-001');
      expect(typeof result.token).toBe('string');
      expect(result.token.length).toBeGreaterThan(0);

      const savedContract = await contractsRepo.findOne({
        where: { id: result.id },
        relations: ['slot'],
      });
      expect(savedContract).not.toBeNull();
      expect(savedContract?.slot?.id).toBe(slot.id);

      const savedItems = await contractPackagesRepo.find({
        where: { contractId: result.id },
      });
      expect(savedItems).toHaveLength(1);
      expect(savedItems[0]?.packageId).toBe(pkg.id);
      expect(savedItems[0]?.quantity).toBe(2);
      expect(savedItems[0]?.basePriceSnapshot).toBe(100);

      const updatedContract = await contractsRepo.findOne({
        where: { id: result.id },
      });
      expect(updatedContract?.total).toBe(200);

      const link = await contractSlotsRepo.findOne({
        where: { contractId: result.id, slotId: slot.id },
      });
      expect(link).toBeDefined();
    });

    it('should throw NotFoundException if slot is not found', async () => {
      const user = await userFactory.create();
      const dto: CreateContractFromSlotsDto = {
        userId: user.id,
        slotId: 999999,
        sku: 'SKU-TEST-002',
        clientName: 'Ana',
        clientPhone: null,
        clientEmail: null,
        subtotal: 0,
        discountTotal: 0,
        total: 0,
        packages: [],
      };
      await expect(service.createContract(dto)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('should throw ConflictException if slot is available (not held/reserved)', async () => {
      const user = await userFactory.create();
      const slot = await slotFactory.create({
        status: SLOT_STATUS.AVAILABLE,
        period: SLOT_PERIOD.AM_BLOCK,
      });
      const dto: CreateContractFromSlotsDto = {
        userId: user.id,
        slotId: slot.id,
        sku: 'SKU-TEST-003',
        clientName: 'Ana',
        clientPhone: null,
        clientEmail: null,
        subtotal: 0,
        discountTotal: 0,
        total: 0,
        packages: [],
      };
      await expect(service.createContract(dto)).rejects.toBeInstanceOf(
        ConflictException,
      );
    });

    it('should throw ConflictException if slot is already used by another contract', async () => {
      const user = await userFactory.create();
      const slot = await slotFactory.create({
        status: SLOT_STATUS.RESERVED,
        period: SLOT_PERIOD.AM_BLOCK,
      });

      const first = await service.createContract({
        userId: user.id,
        slotId: slot.id,
        sku: 'SKU-TEST-004',
        clientName: 'Ana',
        clientPhone: null,
        clientEmail: null,
        subtotal: 0,
        discountTotal: 0,
        total: 0,
        packages: [],
      });

      expect(first.id).toBeDefined();

      await expect(
        service.createContract({
          userId: user.id,
          slotId: slot.id,
          sku: 'SKU-TEST-005',
          clientName: 'Ana',
          clientPhone: null,
          clientEmail: null,
          subtotal: 0,
          discountTotal: 0,
          total: 0,
          packages: [],
        }),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('getDetail', () => {
    it('should throw if contract is not found', async () => {
      await expect(service.getDetail(999999)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('should return contract, legacy slot, packages, payments, and paidAmount', async () => {
      const user = await userFactory.create();
      const slot = await slotFactory.create({
        eventDate: '2030-01-01',
        period: SLOT_PERIOD.AM_BLOCK,
        status: SLOT_STATUS.RESERVED,
      });

      const contract = await contractsRepo.save(
        contractsRepo.create({
          userId: user.id,
          sku: 'SKU-DETAIL-001',
          token: 'test-token',
          status: CONTRACT_STATUS.CONFIRMED,
          slot,
        }),
      );

      const brand = await brandFactory.create();
      const pkg = await packageFactory.createForBrand(brand, { basePrice: 50 });
      await contractPackagesRepo.save(
        contractPackagesRepo.create({
          contractId: contract.id,
          packageId: pkg.id,
          quantity: 3,
          nameSnapshot: pkg.name,
          basePriceSnapshot: 50,
        }),
      );

      const payment1 = await paymentsRepo.save(
        paymentsRepo.create({
          contractId: contract.id,
          amount: 40,
          receivedAt: new Date('2030-01-01T10:00:00.000Z'),
          note: null,
          reference: null,
          method: PAYMENT_METHOD.CASH,
        }),
      );
      const payment2 = await paymentsRepo.save(
        paymentsRepo.create({
          contractId: contract.id,
          amount: 60,
          receivedAt: new Date('2030-01-01T11:00:00.000Z'),
          note: 'partial',
          reference: 'ref',
          method: PAYMENT_METHOD.CARD,
        }),
      );

      const detail = await service.getDetail(contract.id);

      expect(detail.contract.id).toBe(contract.id);
      expect(detail.contract.status).toBe(CONTRACT_STATUS.CONFIRMED);
      expect(detail.contract.token).toBe('test-token');

      expect(detail.slot.id).toBe(slot.id);

      const paymentIds = detail.payments.map((p) => p.id).sort((a, b) => a - b);
      expect(paymentIds).toEqual(
        [payment1.id, payment2.id].sort((a, b) => a - b),
      );
      expect(detail.paidAmount).toBeCloseTo(100);
    });
  });

  describe('removeContract', () => {
    it('should soft-delete contract, contract slots, item snapshots, payments, and associated slots', async () => {
      const user = await userFactory.create();
      const brand = await brandFactory.create();
      const pkg = await packageFactory.createForBrand(brand, { basePrice: 120 });
      const slot = await slotFactory.create({
        status: SLOT_STATUS.RESERVED,
        period: SLOT_PERIOD.AM_BLOCK,
      });

      const created = await service.createContract({
        userId: user.id,
        slotId: slot.id,
        sku: 'SKU-REMOVE-001',
        clientName: 'Ana',
        clientPhone: null,
        clientEmail: null,
        subtotal: 0,
        discountTotal: 0,
        total: 240,
        packages: [{ packageId: pkg.id, quantity: 2 }],
      });

      const payment = await paymentsRepo.save(
        paymentsRepo.create({
          contractId: created.id,
          amount: 50,
          receivedAt: new Date('2030-01-01T10:00:00.000Z'),
          note: 'deposit',
          reference: null,
          method: PAYMENT_METHOD.CASH,
        }),
      );

      await service.removeContract(created.id);

      const visibleContract = await contractsRepo.findOne({
        where: { id: created.id },
      });
      expect(visibleContract).toBeNull();

      const deletedContract = await contractsRepo.findOne({
        where: { id: created.id },
        withDeleted: true,
      });
      expect(deletedContract).not.toBeNull();
      expect(deletedContract?.deletedAt).not.toBeNull();

      const deletedLink = await contractSlotsRepo.findOne({
        where: { contractId: created.id, slotId: slot.id },
        withDeleted: true,
      });
      expect(deletedLink).not.toBeNull();
      expect(deletedLink?.deletedAt).not.toBeNull();

      const deletedItem = await contractPackagesRepo.findOne({
        where: { contractId: created.id },
        withDeleted: true,
      });
      expect(deletedItem).not.toBeNull();
      expect(deletedItem?.deletedAt).not.toBeNull();

      const visiblePayments = await paymentsRepo.find({
        where: { contractId: created.id },
      });
      expect(visiblePayments).toHaveLength(0);

      const deletedPayment = await paymentsRepo.findOne({
        where: { id: payment.id },
        withDeleted: true,
      });
      expect(deletedPayment).not.toBeNull();
      expect(deletedPayment?.deletedAt).not.toBeNull();

      const visibleSlot = await slotsRepo.findOne({ where: { id: slot.id } });
      expect(visibleSlot).toBeNull();

      const deletedSlot = await slotsRepo.findOne({
        where: { id: slot.id },
        withDeleted: true,
      });
      expect(deletedSlot).not.toBeNull();
      expect(deletedSlot?.deletedAt).not.toBeNull();
    });

    it('should throw NotFoundException if contract is not found', async () => {
      await expect(service.removeContract(999999)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });
});
