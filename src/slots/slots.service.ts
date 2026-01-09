import {
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
import { Slot } from './entities/slot.entity';
import { SLOT_PERIOD } from './types/slot-period.types';
import { SLOT_STATUS } from './types/slot-status.types';
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
}
