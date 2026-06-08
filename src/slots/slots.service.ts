import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { plainToInstance } from 'class-transformer';
import { EXCEPTION_RESPONSE } from '../config/errors/exception-response.config';
import { ContractSlot } from '../contracts/entities/contract-slot.entity';
import { Contract } from '../contracts/entities/contract.entity';
import { Brand } from '../brands/entities/brand.entity';
import { CONTRACT_SLOT_PURPOSE } from '../contracts/constants/slot_purpose.enum';
import { BookSlotDto } from './dto/book-slot.dto';
import { HoldSlotDto } from './dto/hold-slot.dto';
import { SlotAvailabilityDto } from './dto/slot-availability.dto';
import { SlotsCalendarDto } from './dto/slots-calendar.dto';
import {
  SlotsCalendarV2ContractInfoDto,
  SlotsCalendarV2DayDto,
} from './dto/slots-calendar-v2.dto';
import { Slot } from './entities/slot.entity';
import { SLOT_PERIOD } from './constants/slot_period.enum';
import { SLOT_STATUS } from './constants/slot_status.enum';
import { SlotDto } from './dto/slot.dto';
import { isUniqueViolation } from '../config/errors/exceptions-handler';

const PERIODS_IN_ORDER: SLOT_PERIOD[] = [
  SLOT_PERIOD.AM_BLOCK,
  SLOT_PERIOD.PM_BLOCK,
];

@Injectable()
export class SlotsService {
  private readonly logger = new Logger(SlotsService.name);

  constructor(
    @InjectRepository(Slot)
    private slotsRepository: Repository<Slot>,
    @InjectRepository(ContractSlot)
    private contractSlotsRepository: Repository<ContractSlot>,
    @InjectRepository(Brand)
    private brandsRepository: Repository<Brand>,
    @InjectRepository(Contract)
    private contractsRepository: Repository<Contract>,
  ) {}

  /**
   * Returns a lightweight month calendar for slots, optimized for frontend usage.
   * Only days that have at least one RESERVED slot are returned.
   * When brandId is provided, also computes monthly risk based on brand config.
   */
  async getCalendarByMonth(
    year: number,
    month: number,
    brandId?: number,
  ): Promise<{ risk: boolean; days: SlotsCalendarDto[] }> {
    if (!Number.isInteger(year) || year < 1900 || year > 2200) {
      throw new BadRequestException('Invalid query params');
    }
    if (!Number.isInteger(month) || month < 1 || month > 12) {
      throw new BadRequestException('Invalid query params');
    }

    const startDate = this.formatUtcDate(
      new Date(Date.UTC(year, month - 1, 1)),
    );
    const endDate = this.formatUtcDate(new Date(Date.UTC(year, month, 1)));

    const reservedSlots = await this.slotsRepository
      .createQueryBuilder('slot')
      .select(['slot.eventDate', 'slot.period'])
      .where('slot.eventDate >= :startDate', { startDate })
      .andWhere('slot.eventDate < :endDate', { endDate })
      .andWhere('slot.status = :status', { status: SLOT_STATUS.RESERVED })
      .orderBy('slot.eventDate', 'ASC')
      .getMany();

    const dayMap = new Map<
      string,
      { morning: SLOT_STATUS; afternoon: SLOT_STATUS }
    >();

    for (const slot of reservedSlots) {
      const date = slot.eventDate;
      const current =
        dayMap.get(date) ??
        ({
          morning: SLOT_STATUS.AVAILABLE,
          afternoon: SLOT_STATUS.AVAILABLE,
        } as const);

      if (slot.period === SLOT_PERIOD.AM_BLOCK) {
        dayMap.set(date, { ...current, morning: SLOT_STATUS.RESERVED });
        continue;
      }
      if (slot.period === SLOT_PERIOD.PM_BLOCK) {
        dayMap.set(date, { ...current, afternoon: SLOT_STATUS.RESERVED });
      }
    }

    const days: SlotsCalendarDto[] = Array.from(dayMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, slots]) => ({ date, slots }));

    const risk = await this.computeMonthlyRisk(brandId, startDate, endDate);

    return {
      risk,
      days: plainToInstance(SlotsCalendarDto, days, {
        excludeExtraneousValues: true,
      }),
    };
  }

  private async computeMonthlyRisk(
    brandId: number | undefined,
    startDate: string,
    endDate: string,
  ): Promise<boolean> {
    if (!brandId) return false;

    const brand = await this.brandsRepository.findOne({ where: { id: brandId } });
    if (!brand || !brand.expoMonthlyRiskEnabled) return false;

    const count = await this.contractsRepository
      .createQueryBuilder('contract')
      .leftJoin(
        'contract.contractSlots',
        'contractSlot',
        'contractSlot.deleted_at IS NULL AND contractSlot.purpose = :purpose',
        { purpose: CONTRACT_SLOT_PURPOSE.EVENT },
      )
      .leftJoin(
        'contractSlot.slot',
        'contractSlotDate',
        'contractSlotDate.deleted_at IS NULL',
      )
      .leftJoin(
        'contract.slot',
        'legacySlotDate',
        'legacySlotDate.deleted_at IS NULL',
      )
      .where('contract.brand_id = :brandId', { brandId })
      .andWhere('contract.deleted_at IS NULL')
      .andWhere(
        `(
          (
            contractSlotDate.event_date >= :startDate
            AND contractSlotDate.event_date < :endDate
          )
          OR (
            legacySlotDate.event_date >= :startDate
            AND legacySlotDate.event_date < :endDate
          )
        )`,
        { startDate, endDate },
      )
      .getCount();

    return count > 0;
  }

  /**
   * V2 of the monthly slots calendar. Slots are managed at company level
   * (not per brand — the same staff covers multiple brands), so unlike v1
   * this version has no brandId/risk segmentation at all.
   * Optionally joins reserved slots to their linked contract via `contractInfo`.
   */
  async getCalendarByMonthV2(
    year: number,
    month: number,
    contractInfo?: boolean,
  ): Promise<{ days: SlotsCalendarV2DayDto[] }> {
    if (!Number.isInteger(year) || year < 1900 || year > 2200) {
      throw new BadRequestException('Invalid query params');
    }
    if (!Number.isInteger(month) || month < 1 || month > 12) {
      throw new BadRequestException('Invalid query params');
    }

    const startDate = this.formatUtcDate(
      new Date(Date.UTC(year, month - 1, 1)),
    );
    const endDate = this.formatUtcDate(new Date(Date.UTC(year, month, 1)));

    const reservedSlots = await this.slotsRepository
      .createQueryBuilder('slot')
      .select(['slot.eventDate', 'slot.period'])
      .where('slot.eventDate >= :startDate', { startDate })
      .andWhere('slot.eventDate < :endDate', { endDate })
      .andWhere('slot.status = :status', { status: SLOT_STATUS.RESERVED })
      .orderBy('slot.eventDate', 'ASC')
      .getMany();

    const dayMap = new Map<
      string,
      { morning: SLOT_STATUS; afternoon: SLOT_STATUS }
    >();

    for (const slot of reservedSlots) {
      const date = slot.eventDate;
      const current =
        dayMap.get(date) ??
        ({
          morning: SLOT_STATUS.AVAILABLE,
          afternoon: SLOT_STATUS.AVAILABLE,
        } as const);

      if (slot.period === SLOT_PERIOD.AM_BLOCK) {
        dayMap.set(date, { ...current, morning: SLOT_STATUS.RESERVED });
        continue;
      }
      if (slot.period === SLOT_PERIOD.PM_BLOCK) {
        dayMap.set(date, { ...current, afternoon: SLOT_STATUS.RESERVED });
      }
    }

    const contractInfoByDateAndPeriod = contractInfo
      ? await this.getContractInfoByDateAndPeriod(startDate, endDate)
      : null;

    const days = Array.from(dayMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, slots]) => {
        if (!contractInfoByDateAndPeriod) {
          return { date, slots };
        }
        return {
          date,
          slots,
          contracts: {
            morning:
              contractInfoByDateAndPeriod.get(
                this.contractInfoKey(date, SLOT_PERIOD.AM_BLOCK),
              ) ?? null,
            afternoon:
              contractInfoByDateAndPeriod.get(
                this.contractInfoKey(date, SLOT_PERIOD.PM_BLOCK),
              ) ?? null,
          },
        };
      });

    return {
      days: plainToInstance(SlotsCalendarV2DayDto, days, {
        excludeExtraneousValues: true,
      }),
    };
  }

  /**
   * Builds a map of reserved slots (by event date + period) to their linked
   * contract info. Mirrors the dual-relation lookup used by computeMonthlyRisk:
   * contracts can be linked via `contract_slots` (current) or `contract.slot`
   * (legacy single-slot relation).
   */
  private async getContractInfoByDateAndPeriod(
    startDate: string,
    endDate: string,
  ): Promise<Map<string, SlotsCalendarV2ContractInfoDto>> {
    const map = new Map<string, SlotsCalendarV2ContractInfoDto>();

    const links = await this.contractSlotsRepository
      .createQueryBuilder('contractSlot')
      .innerJoinAndSelect('contractSlot.slot', 'slot')
      .innerJoinAndSelect('contractSlot.contract', 'contract')
      .where('contractSlot.deleted_at IS NULL')
      .andWhere('contractSlot.purpose = :purpose', {
        purpose: CONTRACT_SLOT_PURPOSE.EVENT,
      })
      .andWhere('slot.deleted_at IS NULL')
      .andWhere('slot.status = :status', { status: SLOT_STATUS.RESERVED })
      .andWhere('slot.event_date >= :startDate', { startDate })
      .andWhere('slot.event_date < :endDate', { endDate })
      .andWhere('contract.deleted_at IS NULL')
      .getMany();

    for (const link of links) {
      if (!link.slot || !link.contract) continue;
      map.set(
        this.contractInfoKey(link.slot.eventDate, link.slot.period),
        plainToInstance(SlotsCalendarV2ContractInfoDto, link.contract, {
          excludeExtraneousValues: true,
        }),
      );
    }

    const legacyContracts = await this.contractsRepository
      .createQueryBuilder('contract')
      .innerJoinAndSelect('contract.slot', 'slot')
      .where('contract.deleted_at IS NULL')
      .andWhere('slot.deleted_at IS NULL')
      .andWhere('slot.status = :status', { status: SLOT_STATUS.RESERVED })
      .andWhere('slot.event_date >= :startDate', { startDate })
      .andWhere('slot.event_date < :endDate', { endDate })
      .getMany();

    for (const contract of legacyContracts) {
      if (!contract.slot) continue;
      const key = this.contractInfoKey(
        contract.slot.eventDate,
        contract.slot.period,
      );
      if (!map.has(key)) {
        map.set(
          key,
          plainToInstance(SlotsCalendarV2ContractInfoDto, contract, {
            excludeExtraneousValues: true,
          }),
        );
      }
    }

    return map;
  }

  private contractInfoKey(eventDate: string, period: SLOT_PERIOD): string {
    return `${eventDate}__${period}`;
  }

  async getById(id: number) {
    try {
      const slot = await this.slotsRepository.findOneBy({ id });

      if (!slot) {
        throw new NotFoundException(EXCEPTION_RESPONSE.SLOT_NOT_AVAILABLE);
      }
      return plainToInstance(SlotDto, slot, {
        excludeExtraneousValues: true,
      });
    } catch (error) {
      this.logger.error(error, 'Error holding slot');
      throw new NotFoundException(EXCEPTION_RESPONSE.SLOT_NOT_AVAILABLE);
    }
  }

  async getAvailabilityByDate(date: string): Promise<SlotAvailabilityDto[]> {
    const slots = await this.slotsRepository.find({
      where: { eventDate: date },
    });
    const slotByPeriod = new Map<SLOT_PERIOD, Slot>(
      slots.map((slot) => [slot.period, slot]),
    );

    const availability = PERIODS_IN_ORDER.map((period) => {
      const slot = slotByPeriod.get(period);
      return {
        period,
        available: !slot || slot.status === SLOT_STATUS.AVAILABLE,
        slot: slot
          ? {
              id: slot.id,
              status: slot.status,
            }
          : null,
      };
    });

    return plainToInstance(SlotAvailabilityDto, availability, {
      excludeExtraneousValues: true,
    });
  }

  async hold(holdSlotDto: HoldSlotDto): Promise<SlotDto> {
    if (
      holdSlotDto.period !== SLOT_PERIOD.AM_BLOCK &&
      holdSlotDto.period !== SLOT_PERIOD.PM_BLOCK
    ) {
      throw new UnprocessableEntityException(EXCEPTION_RESPONSE.INVALID_PERIOD);
    }
    try {
      const slotToSave = this.slotsRepository.create({
        eventDate: holdSlotDto.eventDate,
        period: holdSlotDto.period,
        status: SLOT_STATUS.RESERVED,
      });
      const savedSlot = await this.slotsRepository.save(slotToSave);
      return plainToInstance(SlotDto, savedSlot, {
        excludeExtraneousValues: true,
      });
    } catch (error) {
      this.logger.error(error, 'Error holding slot');
      if (isUniqueViolation(error)) {
        throw new ConflictException(EXCEPTION_RESPONSE.SLOT_NOT_AVAILABLE);
      }
      throw new InternalServerErrorException(error);
    }
  }

  async book(id: number, dto: BookSlotDto): Promise<SlotDto> {
    const slot = await this.slotsRepository.findOne({
      where: { id },
    });
    if (!slot) {
      throw new NotFoundException(EXCEPTION_RESPONSE.SLOT_NOT_FOUND);
    }

    const existingLink = await this.contractSlotsRepository.findOne({
      where: { slotId: id },
    });
    if (existingLink) {
      throw new ConflictException(EXCEPTION_RESPONSE.SLOT_ALREADY_USED);
    }

    const link = this.contractSlotsRepository.create({
      slotId: id,
      contractId: dto.contractId,
    });
    await this.contractSlotsRepository.save(link);

    if (slot.status !== SLOT_STATUS.RESERVED) {
      await this.slotsRepository.update(id, { status: SLOT_STATUS.RESERVED });
      const updated = await this.slotsRepository.findOne({ where: { id } });
      return plainToInstance(SlotDto, updated, {
        excludeExtraneousValues: true,
      });
    }

    return plainToInstance(SlotDto, slot, {
      excludeExtraneousValues: true,
    });
  }

  async cancel(id: number): Promise<{ ok: true }> {
    const slot = await this.slotsRepository.findOne({
      where: { id },
    });
    if (!slot) {
      throw new NotFoundException(EXCEPTION_RESPONSE.SLOT_NOT_FOUND);
    }

    const existingLink = await this.contractSlotsRepository.findOne({
      where: { slotId: id },
    });
    if (existingLink) {
      throw new ConflictException(EXCEPTION_RESPONSE.SLOT_ALREADY_USED);
    }
    await this.slotsRepository.softDelete(id);
    return { ok: true };
  }

  async findActiveByContractId(contractId: number): Promise<SlotDto[]> {
    const links = await this.contractSlotsRepository.find({
      where: { contractId },
      relations: ['slot'],
    });
    const slots = links
      .map((l) => l.slot)
      .filter((s): s is Slot => Boolean(s));
    return plainToInstance(SlotDto, slots, {
      excludeExtraneousValues: true,
    });
  }

  private formatUtcDate(date: Date): string {
    return date.toISOString().slice(0, 10);
  }
}
