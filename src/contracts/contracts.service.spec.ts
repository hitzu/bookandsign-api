import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';
import { DataSource } from 'typeorm';

import { AppDataSource as TestDataSource } from '../config/database/data-source';
import { BrandFactory } from '../../test/factories/brands/brands.factories';
import { PackageFactory } from '../../test/factories/packages/package.factory';
import { SlotFactory } from '../../test/factories/slots/slot.factory';
import { UserFactory } from '../../test/factories/user/user.factory';
import { ExtraFactory } from '../../test/factories/extras/extra.factory';
import { PaymentsService } from '../payments/payments.service';
import { ContractsService } from './contracts.service';
import { AddExtraDto } from './dto/add-extra.dto';
import { AddItemDto } from './dto/add-item.dto';
import { CreateContractFromSlotsDto } from './dto/create-contract-from-slots.dto';
import { Contract } from './entities/contract.entity';
import { ContractExtra } from './entities/contract-extra.entity';
import { ContractPackage } from './entities/contract-package.entity';
import { Extra } from '../extras/entities/extra.entity';
import { Payment } from '../payments/entities/payment.entity';
import { CONTRACT_STATUS } from './types/contract-status.types';
import { PAYMENT_METHOD } from './types/payment-method.types';
import { Package } from '../packages/entities/package.entity';
import { Slot } from '../slots/entities/slot.entity';
import { SLOT_PERIOD } from '../slots/types/slot-period.types';
import { SLOT_STATUS } from '../slots/types/slot-status.types';
import { User } from '../users/entities/user.entity';
import { ContractSlot } from './entities/contract-slot.entity';
import { Event } from '../events/entities/event.entity';
import { EventFactory } from '../../test/factories/events/event.factory';
import { EXTRA_STATUS } from '../extras/types/extras-status.types';

describe('ContractsService', () => {
  let service: ContractsService;
  let contractsRepo: Repository<Contract>;
  let contractExtrasRepo: Repository<ContractExtra>;
  let contractPackagesRepo: Repository<ContractPackage>;
  let paymentsRepo: Repository<Payment>;
  let contractSlotsRepo: Repository<ContractSlot>;
  let slotsRepo: Repository<Slot>;
  let packageFactory: PackageFactory;
  let extraFactory: ExtraFactory;
  let brandFactory: BrandFactory;
  let slotFactory: SlotFactory;
  let userFactory: UserFactory;
  let eventFactory: EventFactory;

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
          provide: getRepositoryToken(ContractExtra),
          useValue: TestDataSource.getRepository(ContractExtra),
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
          provide: getRepositoryToken(Extra),
          useValue: TestDataSource.getRepository(Extra),
        },
        {
          provide: getRepositoryToken(User),
          useValue: TestDataSource.getRepository(User),
        },
        {
          provide: getRepositoryToken(Event),
          useValue: TestDataSource.getRepository(Event),
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
    contractExtrasRepo = module.get<Repository<ContractExtra>>(
      getRepositoryToken(ContractExtra),
    );
    contractSlotsRepo = module.get<Repository<ContractSlot>>(
      getRepositoryToken(ContractSlot),
    );
    paymentsRepo = module.get<Repository<Payment>>(getRepositoryToken(Payment));

    packageFactory = new PackageFactory(TestDataSource);
    extraFactory = new ExtraFactory(TestDataSource);
    brandFactory = new BrandFactory(TestDataSource);
    slotFactory = new SlotFactory(TestDataSource);
    userFactory = new UserFactory(TestDataSource);
    eventFactory = new EventFactory(TestDataSource);
  });

  describe('list', () => {
    it('should return contracts with eventToken when contract has an event', async () => {
      const user = await userFactory.create();
      const slot = await slotFactory.create({
        status: SLOT_STATUS.RESERVED,
        period: SLOT_PERIOD.AM_BLOCK,
      });

      const contract = await contractsRepo.save(
        contractsRepo.create({
          userId: user.id,
          sku: 'SKU-LIST-001',
          token: 'list-token-001',
          status: CONTRACT_STATUS.CONFIRMED,
          slot,
        }),
      );

      const eventToken = 'a1b2c3d4-e5f6-4789-a012-345678901234';
      const event = await eventFactory.create({
        contractId: contract.id,
        token: eventToken,
        name: 'Test Event',
        key: 'list-test-key-001',
      });

      const list = await service.list();

      const found = list.find((c) => c.id === contract.id);
      expect(found).toBeDefined();
      expect(found?.eventToken).toBe(eventToken);
    });

    it('should return eventToken as null when contract has no event', async () => {
      const user = await userFactory.create();
      const slot = await slotFactory.create({
        status: SLOT_STATUS.RESERVED,
        period: SLOT_PERIOD.AM_BLOCK,
      });

      const contract = await contractsRepo.save(
        contractsRepo.create({
          userId: user.id,
          sku: 'SKU-LIST-002',
          token: 'list-token-002',
          status: CONTRACT_STATUS.CONFIRMED,
          slot,
        }),
      );

      const list = await service.list();

      const found = list.find((c) => c.id === contract.id);
      expect(found).toBeDefined();
      expect(found?.eventToken).toBeNull();
    });

    it('should exclude finalized contracts by default', async () => {
      const user = await userFactory.create();
      const slot = await slotFactory.create({
        status: SLOT_STATUS.RESERVED,
        period: SLOT_PERIOD.AM_BLOCK,
      });

      const finalizedContract = await contractsRepo.save(
        contractsRepo.create({
          userId: user.id,
          sku: 'SKU-LIST-FINALIZED',
          token: 'list-token-finalized',
          status: CONTRACT_STATUS.FINALIZED,
          slot,
        }),
      );

      const list = await service.list();
      const found = list.find((c) => c.id === finalizedContract.id);
      expect(found).toBeUndefined();
    });

    it('should include finalized contracts when includeFinalized is true', async () => {
      const user = await userFactory.create();
      const slot = await slotFactory.create({
        status: SLOT_STATUS.RESERVED,
        period: SLOT_PERIOD.AM_BLOCK,
      });

      const finalizedContract = await contractsRepo.save(
        contractsRepo.create({
          userId: user.id,
          sku: 'SKU-LIST-FINALIZED-INCLUDE',
          token: 'list-token-finalized-include',
          status: CONTRACT_STATUS.FINALIZED,
          slot,
        }),
      );

      const list = await service.list({ includeFinalized: true });
      const found = list.find((c) => c.id === finalizedContract.id);
      expect(found).toBeDefined();
      expect(found?.status).toBe(CONTRACT_STATUS.FINALIZED);
    });
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

    it('should persist brandId when provided', async () => {
      // Arrange
      const user = await userFactory.create();
      const brand = await brandFactory.create();
      const slot = await slotFactory.create({
        status: SLOT_STATUS.RESERVED,
        period: SLOT_PERIOD.AM_BLOCK,
      });
      const dto: CreateContractFromSlotsDto = {
        userId: user.id,
        slotId: slot.id,
        brandId: brand.id,
        sku: 'SKU-BRAND-001',
        clientName: 'Cliente Expo',
        clientPhone: null,
        clientEmail: null,
        subtotal: 4500,
        discountTotal: 0,
        total: 4500,
        packages: [],
      };

      // Act
      const result = await service.createContract(dto);

      // Assert
      const saved = await contractsRepo.findOne({ where: { id: result.id } });
      expect(saved?.brandId).toBe(brand.id);
    });

    it('should persist extra snapshots when contract includes extras', async () => {
      const user = await userFactory.create();
      const brand = await brandFactory.create();
      const pkg = await packageFactory.createForBrand(brand, {
        basePrice: 2500,
      });
      const extra = await extraFactory.createForBrand(brand, {
        name: 'Upgrade back',
        price: 500,
        status: EXTRA_STATUS.ACTIVE,
      });
      const slot = await slotFactory.create({
        status: SLOT_STATUS.RESERVED,
        period: SLOT_PERIOD.AM_BLOCK,
      });

      const packages: AddItemDto[] = [{ packageId: pkg.id, quantity: 1 }];
      const extras: AddExtraDto[] = [{ extraId: extra.id, quantity: 2 }];
      const dto: CreateContractFromSlotsDto = {
        userId: user.id,
        slotId: slot.id,
        brandId: brand.id,
        sku: 'SKU-EXTRAS-001',
        clientName: 'Ana',
        clientPhone: null,
        clientEmail: null,
        subtotal: 0,
        discountTotal: 0,
        total: 3500,
        packages,
        extras,
      };

      const result = await service.createContract(dto);

      const savedExtras = await contractExtrasRepo.find({
        where: { contractId: result.id },
      });
      expect(savedExtras).toHaveLength(1);
      expect(savedExtras[0]?.extraId).toBe(extra.id);
      expect(savedExtras[0]?.quantity).toBe(2);
      expect(savedExtras[0]?.nameSnapshot).toBe('Upgrade back');
      expect(savedExtras[0]?.basePriceSnapshot).toBe(500);
    });

    it('should require brandId when contract includes extras', async () => {
      const user = await userFactory.create();
      const brand = await brandFactory.create();
      const extra = await extraFactory.createForBrand(brand, {
        status: EXTRA_STATUS.ACTIVE,
      });
      const slot = await slotFactory.create({
        status: SLOT_STATUS.RESERVED,
        period: SLOT_PERIOD.AM_BLOCK,
      });

      const dto: CreateContractFromSlotsDto = {
        userId: user.id,
        slotId: slot.id,
        sku: 'SKU-EXTRAS-NO-BRAND',
        clientName: 'Ana',
        clientPhone: null,
        clientEmail: null,
        subtotal: 0,
        discountTotal: 0,
        total: 500,
        packages: [],
        extras: [{ extraId: extra.id, quantity: 1 }],
      };

      await expect(service.createContract(dto)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('should reject inactive extras', async () => {
      const user = await userFactory.create();
      const brand = await brandFactory.create();
      const extra = await extraFactory.createForBrand(brand, {
        status: EXTRA_STATUS.INACTIVE,
      });
      const slot = await slotFactory.create({
        status: SLOT_STATUS.RESERVED,
        period: SLOT_PERIOD.AM_BLOCK,
      });

      const dto: CreateContractFromSlotsDto = {
        userId: user.id,
        slotId: slot.id,
        brandId: brand.id,
        sku: 'SKU-EXTRAS-INACTIVE',
        clientName: 'Ana',
        clientPhone: null,
        clientEmail: null,
        subtotal: 0,
        discountTotal: 0,
        total: 500,
        packages: [],
        extras: [{ extraId: extra.id, quantity: 1 }],
      };

      await expect(service.createContract(dto)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('should reject extras from another brand', async () => {
      const user = await userFactory.create();
      const contractBrand = await brandFactory.create();
      const extraBrand = await brandFactory.create();
      const extra = await extraFactory.createForBrand(extraBrand, {
        status: EXTRA_STATUS.ACTIVE,
      });
      const slot = await slotFactory.create({
        status: SLOT_STATUS.RESERVED,
        period: SLOT_PERIOD.AM_BLOCK,
      });

      const dto: CreateContractFromSlotsDto = {
        userId: user.id,
        slotId: slot.id,
        brandId: contractBrand.id,
        sku: 'SKU-EXTRAS-WRONG-BRAND',
        clientName: 'Ana',
        clientPhone: null,
        clientEmail: null,
        subtotal: 0,
        discountTotal: 0,
        total: 500,
        packages: [],
        extras: [{ extraId: extra.id, quantity: 1 }],
      };

      await expect(service.createContract(dto)).rejects.toBeInstanceOf(
        BadRequestException,
      );
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
      const extra = await extraFactory.createForBrand(brand, {
        name: 'Upgrade back',
        price: 500,
        status: EXTRA_STATUS.ACTIVE,
      });
      await contractExtrasRepo.save(
        contractExtrasRepo.create({
          contractId: contract.id,
          extraId: extra.id,
          quantity: 1,
          nameSnapshot: extra.name,
          basePriceSnapshot: 500,
        }),
      );

      const detail = await service.getDetail(contract.id);

      expect(detail.contract.id).toBe(contract.id);
      expect(detail.contract.status).toBe(CONTRACT_STATUS.CONFIRMED);
      expect(detail.contract.token).toBe('test-token');

      expect(detail.slot.id).toBe(slot.id);
      expect(detail.extras).toHaveLength(1);
      expect(detail.extras[0]?.extraId).toBe(extra.id);
      expect(detail.extras[0]?.nameSnapshot).toBe('Upgrade back');

      const paymentIds = detail.payments.map((p) => p.id).sort((a, b) => a - b);
      expect(paymentIds).toEqual(
        [payment1.id, payment2.id].sort((a, b) => a - b),
      );
      expect(detail.paidAmount).toBeCloseTo(100);
    });
  });

  describe('getDetailByToken', () => {
    it('should return masked client data and include extra snapshots', async () => {
      const user = await userFactory.create();
      const brand = await brandFactory.create();
      const slot = await slotFactory.create({
        eventDate: '2030-01-01',
        period: SLOT_PERIOD.AM_BLOCK,
        status: SLOT_STATUS.RESERVED,
      });

      const contract = await contractsRepo.save(
        contractsRepo.create({
          userId: user.id,
          brandId: brand.id,
          sku: 'SKU-PUBLIC-001',
          token: 'public-token-001',
          status: CONTRACT_STATUS.CONFIRMED,
          clientName: 'Ana',
          clientPhone: '5551234567',
          clientEmail: 'ana@example.com',
          slot,
        }),
      );

      const pkg = await packageFactory.createForBrand(brand, { basePrice: 250 });
      await contractPackagesRepo.save(
        contractPackagesRepo.create({
          contractId: contract.id,
          packageId: pkg.id,
          quantity: 1,
          nameSnapshot: pkg.name,
          basePriceSnapshot: 250,
        }),
      );

      const extra = await extraFactory.createForBrand(brand, {
        name: 'Upgrade back',
        price: 500,
        status: EXTRA_STATUS.ACTIVE,
      });
      await contractExtrasRepo.save(
        contractExtrasRepo.create({
          contractId: contract.id,
          extraId: extra.id,
          quantity: 2,
          nameSnapshot: extra.name,
          basePriceSnapshot: 500,
        }),
      );

      const detail = await service.getDetailByToken(contract.token);

      expect(detail.contract.id).toBe(contract.id);
      expect(detail.contract.clientPhone).toBe('***4567');
      expect(detail.contract.clientEmail).toBe('a****@example.com');
      expect(detail.packages).toHaveLength(1);
      expect(detail.extras).toHaveLength(1);
      expect(detail.extras[0]?.extraId).toBe(extra.id);
      expect(detail.extras[0]?.quantity).toBe(2);
      expect(detail.extras[0]?.nameSnapshot).toBe('Upgrade back');
    });

    it('should throw if token does not exist', async () => {
      await expect(
        service.getDetailByToken('missing-public-token'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('updateItemQuantity', () => {
    it('should recalculate contract totals including extras', async () => {
      const user = await userFactory.create();
      const brand = await brandFactory.create();
      const slot = await slotFactory.create({
        status: SLOT_STATUS.RESERVED,
        period: SLOT_PERIOD.AM_BLOCK,
      });

      const contract = await contractsRepo.save(
        contractsRepo.create({
          userId: user.id,
          brandId: brand.id,
          sku: 'SKU-RECALC-001',
          token: 'recalc-token-001',
          status: CONTRACT_STATUS.CONFIRMED,
          subtotal: 700,
          discountTotal: 0,
          total: 700,
          slot,
        }),
      );

      const pkg = await packageFactory.createForBrand(brand, { basePrice: 100 });
      const item = await contractPackagesRepo.save(
        contractPackagesRepo.create({
          contractId: contract.id,
          packageId: pkg.id,
          quantity: 2,
          nameSnapshot: pkg.name,
          basePriceSnapshot: 100,
        }),
      );

      const extra = await extraFactory.createForBrand(brand, {
        price: 500,
        status: EXTRA_STATUS.ACTIVE,
      });
      await contractExtrasRepo.save(
        contractExtrasRepo.create({
          contractId: contract.id,
          extraId: extra.id,
          quantity: 1,
          nameSnapshot: extra.name,
          basePriceSnapshot: 500,
        }),
      );

      const detail = await service.updateItemQuantity(
        contract.id,
        item.id,
        { quantity: 1 },
        user.id,
      );

      expect(detail.contract.subtotal).toBe(600);
      expect(detail.contract.total).toBe(600);
      expect(detail.extras).toHaveLength(1);
      expect(detail.items[0]?.quantity).toBe(1);

      const updated = await contractsRepo.findOne({
        where: { id: contract.id },
      });
      expect(updated?.subtotal).toBe(600);
      expect(updated?.total).toBe(600);
    });
  });

  describe('finalize', () => {
    it('should finalize a confirmed contract and return status FINALIZED', async () => {
      const user = await userFactory.create();
      const slot = await slotFactory.create({
        status: SLOT_STATUS.RESERVED,
        period: SLOT_PERIOD.AM_BLOCK,
      });

      const contract = await contractsRepo.save(
        contractsRepo.create({
          userId: user.id,
          sku: 'SKU-FINALIZE-001',
          token: 'finalize-token-001',
          status: CONTRACT_STATUS.CONFIRMED,
          slot,
        }),
      );

      const result = await service.finalize(contract.id, user.id);

      expect(result.contract.status).toBe(CONTRACT_STATUS.FINALIZED);

      const updated = await contractsRepo.findOne({
        where: { id: contract.id },
      });
      expect(updated?.status).toBe(CONTRACT_STATUS.FINALIZED);
    });

    it('should throw NotFoundException if contract is not found', async () => {
      const user = await userFactory.create();
      await expect(
        service.finalize(999999, user.id),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('should throw ConflictException if contract is cancelled', async () => {
      const user = await userFactory.create();
      const slot = await slotFactory.create({
        status: SLOT_STATUS.RESERVED,
        period: SLOT_PERIOD.AM_BLOCK,
      });

      const contract = await contractsRepo.save(
        contractsRepo.create({
          userId: user.id,
          sku: 'SKU-FINALIZE-CANCELLED',
          token: 'finalize-token-cancelled',
          status: CONTRACT_STATUS.CANCELLED,
          slot,
        }),
      );

      await expect(
        service.finalize(contract.id, user.id),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('should return detail without changes if contract is already finalized', async () => {
      const user = await userFactory.create();
      const slot = await slotFactory.create({
        status: SLOT_STATUS.RESERVED,
        period: SLOT_PERIOD.AM_BLOCK,
      });

      const contract = await contractsRepo.save(
        contractsRepo.create({
          userId: user.id,
          sku: 'SKU-FINALIZE-ALREADY',
          token: 'finalize-token-already',
          status: CONTRACT_STATUS.FINALIZED,
          slot,
        }),
      );

      const result = await service.finalize(contract.id, user.id);

      expect(result.contract.status).toBe(CONTRACT_STATUS.FINALIZED);
      expect(result.contract.id).toBe(contract.id);
    });
  });

  describe('removeContract', () => {
    it('should soft-delete contract, contract slots, item snapshots, extra snapshots, payments, and associated slots', async () => {
      const user = await userFactory.create();
      const brand = await brandFactory.create();
      const pkg = await packageFactory.createForBrand(brand, { basePrice: 120 });
      const extra = await extraFactory.createForBrand(brand, {
        name: 'Upgrade back',
        price: 500,
        status: EXTRA_STATUS.ACTIVE,
      });
      const slot = await slotFactory.create({
        status: SLOT_STATUS.RESERVED,
        period: SLOT_PERIOD.AM_BLOCK,
      });

      const created = await service.createContract({
        userId: user.id,
        slotId: slot.id,
        brandId: brand.id,
        sku: 'SKU-REMOVE-001',
        clientName: 'Ana',
        clientPhone: null,
        clientEmail: null,
        subtotal: 0,
        discountTotal: 0,
        total: 740,
        packages: [{ packageId: pkg.id, quantity: 2 }],
        extras: [{ extraId: extra.id, quantity: 1 }],
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

      const deletedExtra = await contractExtrasRepo.findOne({
        where: { contractId: created.id },
        withDeleted: true,
      });
      expect(deletedExtra).not.toBeNull();
      expect(deletedExtra?.deletedAt).not.toBeNull();

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
