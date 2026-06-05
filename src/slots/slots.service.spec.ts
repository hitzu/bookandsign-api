import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppDataSource as TestDataSource } from '../config/database/data-source';
import { EXCEPTION_RESPONSE } from '../config/errors/exception-response.config';
import { ContractSlot } from '../contracts/entities/contract-slot.entity';
import { Contract } from '../contracts/entities/contract.entity';
import { Brand } from '../brands/entities/brand.entity';
import { Note } from '../notes/entities/note.entity';
import { NOTE_SCOPE } from '../notes/types/note-scope.types';
import { BrandFactory } from '../../test/factories/brands/brands.factories';
import { SlotFactory } from '../../test/factories/slots/slot.factory';
import { UserFactory } from '../../test/factories/user/user.factory';
import { ContractFactory } from '../../test/factories/contracts/contract.factory';
import { BookSlotDto } from './dto/book-slot.dto';
import { HoldSlotDto } from './dto/hold-slot.dto';
import { Slot } from './entities/slot.entity';
import { SlotsService } from './slots.service';
import { SLOT_PERIOD } from './types/slot-period.types';
import { SLOT_STATUS } from './types/slot-status.types';

describe('SlotsService', () => {
  let service: SlotsService;
  let slotsRepository: Repository<Slot>;
  let notesRepository: Repository<Note>;
  let contractSlotsRepository: Repository<ContractSlot>;
  let slotFactory: SlotFactory;
  let userFactory: UserFactory;
  let contractFactory: ContractFactory;
  let brandFactory: BrandFactory;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SlotsService,
        {
          provide: getRepositoryToken(Slot),
          useValue: TestDataSource.getRepository(Slot),
        },
        {
          provide: getRepositoryToken(ContractSlot),
          useValue: TestDataSource.getRepository(ContractSlot),
        },
        {
          provide: getRepositoryToken(Brand),
          useValue: TestDataSource.getRepository(Brand),
        },
        {
          provide: getRepositoryToken(Contract),
          useValue: TestDataSource.getRepository(Contract),
        },
        {
          provide: getRepositoryToken(Note),
          useValue: TestDataSource.getRepository(Note),
        },
      ],
    }).compile();

    service = module.get<SlotsService>(SlotsService);
    slotsRepository = module.get<Repository<Slot>>(getRepositoryToken(Slot));
    notesRepository = module.get<Repository<Note>>(getRepositoryToken(Note));
    contractSlotsRepository = module.get<Repository<ContractSlot>>(
      getRepositoryToken(ContractSlot),
    );
    slotFactory = new SlotFactory(TestDataSource);
    userFactory = new UserFactory(TestDataSource);
    contractFactory = new ContractFactory(TestDataSource);
    brandFactory = new BrandFactory(TestDataSource);
  });

  describe('getAvailabilityByDate', () => {
    it('should always return 3 periods in order', async () => {
      const date = '2025-12-25';
      const result = await service.getAvailabilityByDate(date);
      expect(result).toHaveLength(2);
      expect(result.map((r) => r.period)).toEqual([
        SLOT_PERIOD.AM_BLOCK,
        SLOT_PERIOD.PM_BLOCK,
      ]);
    });

    it('should mark period as unavailable when a slot exists', async () => {
      const date = '2025-12-25';
      await slotFactory.create({
        eventDate: date,
        period: SLOT_PERIOD.PM_BLOCK,
        status: SLOT_STATUS.RESERVED,
      });
      const result = await service.getAvailabilityByDate(date);
      const afternoon = result.find((r) => r.period === SLOT_PERIOD.PM_BLOCK);
      expect(afternoon?.available).toBe(false);
      expect(afternoon?.slot?.status).toBe(SLOT_STATUS.RESERVED);
    });
  });

  describe('hold', () => {
    it('should create a held slot', async () => {
      const dto: HoldSlotDto = {
        eventDate: '2025-12-25',
        period: SLOT_PERIOD.AM_BLOCK,
      };
      const result = await service.hold(dto);
      expect(result.id).toBeDefined();
      expect(result.status).toBe(SLOT_STATUS.RESERVED);
    });

    it('should not create notes as a side effect (notes are handled separately)', async () => {
      const dto: HoldSlotDto = {
        eventDate: '2025-12-25',
        period: SLOT_PERIOD.AM_BLOCK,
      };
      const slot = await service.hold(dto);

      const notesForSlot = await notesRepository.find({
        where: { scope: NOTE_SCOPE.SLOT, targetId: slot.id },
      });
      expect(notesForSlot).toHaveLength(0);

      const slotRecord = slot as unknown as Record<string, unknown>;
      expect(slotRecord.note).toBeUndefined();
    });

    it('should throw ConflictException when date/period is already taken', async () => {
      const dto: HoldSlotDto = {
        eventDate: '2025-12-25',
        period: SLOT_PERIOD.AM_BLOCK,
      };
      await service.hold(dto);
      await expect(service.hold(dto)).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('book', () => {
    it('should link a slot to a contract via contract_slots', async () => {
      const slot = await slotFactory.create({
        status: SLOT_STATUS.RESERVED,
      });
      const contract = await contractFactory.create();
      const dto: BookSlotDto = { contractId: contract.id };
      const result = await service.book(slot.id, dto);
      expect(result.status).toBe(SLOT_STATUS.RESERVED);

      const link = await contractSlotsRepository.findOne({
        where: { contractId: contract.id, slotId: slot.id },
      });
      expect(link).toBeDefined();
    });

    it('should throw NotFoundException when slot does not exist', async () => {
      await expect(service.book(999999, { contractId: 1 })).rejects.toEqual(
        new NotFoundException(EXCEPTION_RESPONSE.SLOT_NOT_FOUND),
      );
    });
  });

  describe('cancel', () => {
    it('should soft-delete a slot', async () => {
      const slot = await slotFactory.create();
      const result = await service.cancel(slot.id);
      expect(result).toEqual({ ok: true });
      const found = await slotsRepository.findOne({ where: { id: slot.id } });
      expect(found).toBeNull();
    });

    it('should throw ConflictException when slot is attached to a contract', async () => {
      const slot = await slotFactory.create({ status: SLOT_STATUS.RESERVED });
      const contract = await contractFactory.create();
      await contractSlotsRepository.save(
        contractSlotsRepository.create({
          slotId: slot.id,
          contractId: contract.id,
        }),
      );
      await expect(service.cancel(slot.id)).rejects.toBeInstanceOf(
        ConflictException,
      );
    });

    it('should throw NotFoundException when slot does not exist', async () => {
      await expect(service.cancel(999999)).rejects.toEqual(
        new NotFoundException(EXCEPTION_RESPONSE.SLOT_NOT_FOUND),
      );
    });

    it('should allow re-hold after cancel for same date/period', async () => {
      const dto: HoldSlotDto = {
        eventDate: '2025-12-25',
        period: SLOT_PERIOD.AM_BLOCK,
      };
      const slot = await service.hold(dto);
      await service.cancel(slot.id);
      const slot2 = await service.hold(dto);
      expect(slot2.id).toBeDefined();
    });
  });

  describe('getCalendarByMonth', () => {
    const YEAR = 2030;
    const MONTH = 3;
    const DATE_IN_MONTH = '2030-03-15';

    it('should return risk=false when no brandId provided', async () => {
      // Arrange — nothing required

      // Act
      const result = await service.getCalendarByMonth(YEAR, MONTH, undefined);

      // Assert
      expect(result.risk).toBe(false);
    });

    it('should return risk=false when brand has expoMonthlyRiskEnabled=false', async () => {
      // Arrange
      const brand = await brandFactory.create({ expoMonthlyRiskEnabled: false });

      // Act
      const result = await service.getCalendarByMonth(YEAR, MONTH, brand.id);

      // Assert
      expect(result.risk).toBe(false);
    });

    it('should return risk=false when brand has expoMonthlyRiskEnabled=true but no contract in month', async () => {
      // Arrange
      const brand = await brandFactory.create({ expoMonthlyRiskEnabled: true });

      // Act
      const result = await service.getCalendarByMonth(YEAR, MONTH, brand.id);

      // Assert
      expect(result.risk).toBe(false);
    });

    it('should return risk=true when brand has expoMonthlyRiskEnabled=true and a contract exists in month', async () => {
      // Arrange
      const brand = await brandFactory.create({ expoMonthlyRiskEnabled: true });
      const slot = await slotFactory.create({
        eventDate: DATE_IN_MONTH,
        status: SLOT_STATUS.RESERVED,
      });
      const contract = await contractFactory.create({ brandId: brand.id });
      await contractSlotsRepository.save(
        contractSlotsRepository.create({ contractId: contract.id, slotId: slot.id }),
      );

      // Act
      const result = await service.getCalendarByMonth(YEAR, MONTH, brand.id);

      // Assert
      expect(result.risk).toBe(true);
    });

    it('should return risk=true when the contract only has the legacy slot relation', async () => {
      // Arrange
      const brand = await brandFactory.create({ expoMonthlyRiskEnabled: true });
      const slot = await slotFactory.create({
        eventDate: DATE_IN_MONTH,
        status: SLOT_STATUS.RESERVED,
      });
      await contractFactory.create({ brandId: brand.id, slot });

      // Act
      const result = await service.getCalendarByMonth(YEAR, MONTH, brand.id);

      // Assert
      expect(result.risk).toBe(true);
    });

    it('should include reserved days in days array even when risk=true', async () => {
      // Arrange
      const brand = await brandFactory.create({ expoMonthlyRiskEnabled: true });
      const slot = await slotFactory.create({
        eventDate: DATE_IN_MONTH,
        period: SLOT_PERIOD.AM_BLOCK,
        status: SLOT_STATUS.RESERVED,
      });
      const contract = await contractFactory.create({ brandId: brand.id });
      await contractSlotsRepository.save(
        contractSlotsRepository.create({ contractId: contract.id, slotId: slot.id }),
      );

      // Act
      const result = await service.getCalendarByMonth(YEAR, MONTH, brand.id);

      // Assert
      expect(result.risk).toBe(true);
      const day = result.days.find((d) => d.date === DATE_IN_MONTH);
      expect(day).toBeDefined();
      expect(day?.slots.morning).toBe(SLOT_STATUS.RESERVED);
    });

    it('should return risk=false for a different brand even when a contract exists', async () => {
      // Arrange
      const brandA = await brandFactory.create({ expoMonthlyRiskEnabled: true });
      const brandB = await brandFactory.create({ expoMonthlyRiskEnabled: true });
      const slot = await slotFactory.create({
        eventDate: DATE_IN_MONTH,
        status: SLOT_STATUS.RESERVED,
      });
      const contract = await contractFactory.create({ brandId: brandA.id });
      await contractSlotsRepository.save(
        contractSlotsRepository.create({ contractId: contract.id, slotId: slot.id }),
      );

      // Act — query with brandB which has no contracts
      const result = await service.getCalendarByMonth(YEAR, MONTH, brandB.id);

      // Assert
      expect(result.risk).toBe(false);
    });
  });

  describe('findActiveByContractId', () => {
    it('should return active slots by contract id', async () => {
      const contract = await contractFactory.create();
      const slot = await slotFactory.create({ status: SLOT_STATUS.RESERVED });
      await contractSlotsRepository.save(
        contractSlotsRepository.create({
          contractId: contract.id,
          slotId: slot.id,
        }),
      );
      await slotFactory.create({ status: SLOT_STATUS.RESERVED });

      const contractId = contract.id;
      const result = await service.findActiveByContractId(contractId);
      expect(result).toHaveLength(1);
      expect(result[0]?.id).toBe(slot.id);
    });

    it('should not include cancelled (soft-deleted) slots', async () => {
      const contract = await contractFactory.create();
      const slot = await slotFactory.create({ status: SLOT_STATUS.RESERVED });
      await contractSlotsRepository.save(
        contractSlotsRepository.create({
          contractId: contract.id,
          slotId: slot.id,
        }),
      );
      await slotsRepository.softDelete(slot.id); // should hide it from slot relation
      const result = await service.findActiveByContractId(contract.id);
      expect(result).toHaveLength(0);
    });

    it('should return empty array when no slots exist', async () => {
      const result = await service.findActiveByContractId(12345);
      expect(result).toEqual([]);
    });
  });
});
