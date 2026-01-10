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
import { HoldSlotDto } from './dto/hold-slot.dto';
import { SlotAvailabilityDto } from './dto/slot-availability.dto';
import { SlotsCalendarDto } from './dto/slots-calendar.dto';
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
  ) {}

  /**
   * Returns a lightweight month calendar for slots, optimized for frontend usage.
   * Only days that have at least one RESERVED slot are returned.
   */
  async getCalendarByMonth(year: number, month: number): Promise<any> {
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

    return plainToInstance(SlotsCalendarDto, days, {
      excludeExtraneousValues: true,
    });
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

  async cancel(id: number): Promise<{ ok: true }> {
    const slot = await this.slotsRepository.findOne({
      where: { id },
    });
    if (!slot) {
      throw new NotFoundException(EXCEPTION_RESPONSE.SLOT_NOT_FOUND);
    }
    await this.slotsRepository.softDelete(id);
    return { ok: true };
  }

  private formatUtcDate(date: Date): string {
    return date.toISOString().slice(0, 10);
  }
}
