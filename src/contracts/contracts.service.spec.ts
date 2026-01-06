import { ConflictException, ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';
import { DataSource } from 'typeorm';

import { AppDataSource as TestDataSource } from '../config/database/data-source';
import { BrandFactory } from '../../test/factories/brands/brands.factories';
import { PackageFactory } from '../../test/factories/packages/package.factory';
import { SlotFactory } from '../../test/factories/slots/slot.factory';
import { UserFactory } from '../../test/factories/user/user.factory';
import { ContractsService } from './contracts.service';
import { Contract } from './entities/contract.entity';
import { ContractPackage } from './entities/contract-package.entity';
import { Payment } from './entities/payment.entity';
import { CONTRACT_PACKAGE_SOURCE } from './types/contract-package-source.types';
import { CONTRACT_STATUS } from './types/contract-status.types';
import { PAYMENT_METHOD } from './types/payment-method.types';
import { Package } from '../packages/entities/package.entity';
import { Slot } from '../slots/entities/slot.entity';
import { SLOT_STATUS } from '../slots/types/slot-status.types';
import { USER_ROLES } from '../common/types/user-roles.type';
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
  let userFactory: UserFactory;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContractsService,
        { provide: DataSource, useValue: TestDataSource },
        { provide: getRepositoryToken(Contract), useValue: TestDataSource.getRepository(Contract) },
        { provide: getRepositoryToken(Slot), useValue: TestDataSource.getRepository(Slot) },
        {
          provide: getRepositoryToken(ContractPackage),
          useValue: TestDataSource.getRepository(ContractPackage),
        },
        { provide: getRepositoryToken(Payment), useValue: TestDataSource.getRepository(Payment) },
        {
          provide: getRepositoryToken(Package),
          useValue: TestDataSource.getRepository(Package),
        },
        { provide: getRepositoryToken(User), useValue: TestDataSource.getRepository(User) },
      ],
    }).compile();

    service = module.get<ContractsService>(ContractsService);
    contractsRepo = module.get<Repository<Contract>>(getRepositoryToken(Contract));
    slotsRepo = TestDataSource.getRepository(Slot);
    contractPackagesRepo = TestDataSource.getRepository(ContractPackage);
    paymentsRepo = TestDataSource.getRepository(Payment);
    packageFactory = new PackageFactory(TestDataSource);
    brandFactory = new BrandFactory(TestDataSource);
    slotFactory = new SlotFactory(TestDataSource);
    userFactory = new UserFactory(TestDataSource);
  });

  describe('createFromSlots', () => {
    it('should create contract pending and reserve held slots', async () => {
      const brand = await brandFactory.create();
      const slot1 = await slotFactory.create({ status: SLOT_STATUS.HELD, contractId: null });
      const slot2 = await slotFactory.create({ status: SLOT_STATUS.HELD, contractId: null });
      const result = await service.createFromSlots({
        brandId: brand.id,
        slotIds: [slot1.id, slot2.id],
        clientName: 'Client',
        clientPhone: '222110149',
      } as any);
      expect(result.contract.id).toBeDefined();
      expect(result.contract.status).toBe(CONTRACT_STATUS.PENDING);
      const updatedSlots = await slotsRepo.find({
        where: { contractId: result.contract.id },
      });
      expect(updatedSlots).toHaveLength(2);
      expect(updatedSlots.every((s) => s.status === SLOT_STATUS.BOOKED)).toBe(true);
    });

    it('should fail if any slot is not held', async () => {
      const brand = await brandFactory.create();
      const held = await slotFactory.create({ status: SLOT_STATUS.HELD, contractId: null });
      const booked = await slotFactory.create({ status: SLOT_STATUS.BOOKED, contractId: 123 });
      await expect(
        service.createFromSlots({
          brandId: brand.id,
          slotIds: [held.id, booked.id],
          clientName: 'Client',
          clientPhone: '222110149',
        } as any),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('addItem', () => {
    it('should consolidate quantities by (contract, package, source) and update total', async () => {
      const actor = await userFactory.create({ role: USER_ROLES.USER });
      const brand = await brandFactory.create();
      const contract = await contractsRepo.save(
        contractsRepo.create({
          brandId: brand.id,
          clientName: 'Client',
          clientPhone: '222',
          status: CONTRACT_STATUS.PENDING,
          totalAmount: 0,
        }),
      );
      const pkg = await packageFactory.createActive(brand);
      const detail1 = await service.addItem(
        contract.id,
        { packageId: pkg.id, quantity: 1, source: CONTRACT_PACKAGE_SOURCE.PACKAGE } as any,
        actor.id,
      );
      const detail2 = await service.addItem(
        contract.id,
        { packageId: pkg.id, quantity: 2, source: CONTRACT_PACKAGE_SOURCE.PACKAGE } as any,
        actor.id,
      );
      const items = await contractPackagesRepo.find({ where: { contractId: contract.id } });
      expect(items).toHaveLength(1);
      expect(items[0]?.quantity).toBe(3);
      expect(detail2.contract.totalAmount).toBeGreaterThan(0);
      expect(detail2.contract.totalAmount).toBe(detail1.contract.totalAmount * 3);
    });
  });

  describe('addPayment', () => {
    it('should close contract when paid >= total', async () => {
      const actor = await userFactory.create({ role: USER_ROLES.USER });
      const brand = await brandFactory.create();
      const contract = await contractsRepo.save(
        contractsRepo.create({
          brandId: brand.id,
          clientName: 'Client',
          clientPhone: '222',
          status: CONTRACT_STATUS.PENDING,
          totalAmount: 100,
        }),
      );
      const detail = await service.addPayment(
        contract.id,
        {
          amount: 100,
          method: PAYMENT_METHOD.CASH,
          receivedAt: new Date(),
        } as any,
        actor.id,
      );
      expect(detail.contract.status).toBe(CONTRACT_STATUS.CLOSED);
    });
  });

  describe('cancel', () => {
    it('should cancel contract and release (soft-delete) slots', async () => {
      const brand = await brandFactory.create();
      const slot = await slotFactory.create({ status: SLOT_STATUS.HELD, contractId: null });
      const created = await service.createFromSlots({
        brandId: brand.id,
        slotIds: [slot.id],
        clientName: 'Client',
        clientPhone: '222110149',
      } as any);
      const canceled = await service.cancel(created.contract.id);
      expect(canceled.contract.status).toBe(CONTRACT_STATUS.CANCELED);
      const activeSlots = await slotsRepo.find({ where: { contractId: created.contract.id } });
      expect(activeSlots).toHaveLength(0);
    });
  });

  describe('role restrictions', () => {
    it('seller (user) cannot mutate closed', async () => {
      const actor = await userFactory.create({ role: USER_ROLES.USER });
      const brand = await brandFactory.create();
      const contract = await contractsRepo.save(
        contractsRepo.create({
          brandId: brand.id,
          clientName: 'Client',
          clientPhone: '222',
          status: CONTRACT_STATUS.CLOSED,
          totalAmount: 0,
        }),
      );
      const pkg = await packageFactory.createActive(brand);
      await expect(
        service.addItem(contract.id, { packageId: pkg.id, quantity: 1 } as any, actor.id),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('admin can reopen closed', async () => {
      const admin = await userFactory.create({ role: USER_ROLES.ADMIN });
      const brand = await brandFactory.create();
      const contract = await contractsRepo.save(
        contractsRepo.create({
          brandId: brand.id,
          clientName: 'Client',
          clientPhone: '222',
          status: CONTRACT_STATUS.CLOSED,
          totalAmount: 0,
        }),
      );
      const reopened = await service.reopen(contract.id, admin.id);
      expect(reopened.contract.status).toBe(CONTRACT_STATUS.PENDING);
    });
  });
});


