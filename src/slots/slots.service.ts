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
import { BookSlotDto } from './dto/book-slot.dto';
import { HoldSlotDto } from './dto/hold-slot.dto';
import { SlotAvailabilityDto } from './dto/slot-availability.dto';
import { Slot } from './entities/slot.entity';
import { SLOT_PERIOD } from './types/slot-period.types';
import { SLOT_STATUS } from './types/slot-status.types';
import { SlotDto } from './dto/slot.dto';
import { isUniqueViolation } from '../config/errors/exceptions-handler';
import { UpdateLeadInfoSlotDto } from './dto/updateLeadInfoSlot.dto';

const PERIODS_IN_ORDER: SLOT_PERIOD[] = [
  SLOT_PERIOD.MORNING,
  SLOT_PERIOD.AFTERNOON,
  SLOT_PERIOD.EVENING,
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
        available: !slot,
        slot: slot
          ? {
              id: slot.id,
              status: slot.status,
              leadName: slot.leadName,
              leadEmail: slot.leadEmail,
              leadPhone: slot.leadPhone,
              contractId: slot.contractId,
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
      holdSlotDto.period !== SLOT_PERIOD.MORNING &&
      holdSlotDto.period !== SLOT_PERIOD.AFTERNOON &&
      holdSlotDto.period !== SLOT_PERIOD.EVENING
    ) {
      throw new UnprocessableEntityException(EXCEPTION_RESPONSE.INVALID_PERIOD);
    }
    try {
      const slotToSave = this.slotsRepository.create({
        eventDate: holdSlotDto.eventDate,
        period: holdSlotDto.period,
        status: SLOT_STATUS.HELD,
        contractId: null,
        authorId: holdSlotDto.authorId,
        leadName: holdSlotDto.leadName,
        leadEmail: holdSlotDto.leadEmail,
        leadPhone: holdSlotDto.leadPhone,
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

  async book(id: number, bookSlotDto: BookSlotDto): Promise<SlotDto> {
    const slot = await this.slotsRepository.findOne({
      where: { id },
    });
    if (!slot) {
      throw new NotFoundException(EXCEPTION_RESPONSE.SLOT_NOT_FOUND);
    }
    if (
      slot.status === SLOT_STATUS.BOOKED &&
      slot.contractId !== bookSlotDto.contractId
    ) {
      throw new ConflictException(EXCEPTION_RESPONSE.SLOT_ALREADY_BOOKED);
    }
    slot.status = SLOT_STATUS.BOOKED;
    slot.contractId = bookSlotDto.contractId;
    const savedSlot = await this.slotsRepository.save(slot);
    return plainToInstance(SlotDto, savedSlot, {
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
    if (slot.contractId != null) {
      throw new ConflictException(EXCEPTION_RESPONSE.SLOT_ALREADY_BOOKED);
    }
    await this.slotsRepository.softDelete(id);
    return { ok: true };
  }

  async findActiveByContractId(contractId: number): Promise<Slot[]> {
    return await this.slotsRepository.find({
      where: { contractId },
    });
  }

  async updateLeadInfoSlot(
    id: number,
    leadInfo: UpdateLeadInfoSlotDto,
  ): Promise<SlotDto> {
    const slot = await this.slotsRepository.findOne({
      where: { id },
    });
    if (!slot) {
      throw new NotFoundException(EXCEPTION_RESPONSE.SLOT_NOT_FOUND);
    }
    if (slot.contractId != null) {
      throw new ConflictException(EXCEPTION_RESPONSE.SLOT_ALREADY_BOOKED);
    }

    await this.slotsRepository.update(id, {
      ...leadInfo,
    });

    const updatedSlot = await this.slotsRepository.findOne({
      where: { id },
    });

    return plainToInstance(SlotDto, updatedSlot, {
      excludeExtraneousValues: true,
    });
  }
}
