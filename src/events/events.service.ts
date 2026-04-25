import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { randomUUID } from 'node:crypto';
import { QueryFailedError, Repository } from 'typeorm';
import { EXCEPTION_RESPONSE } from '../config/errors/exception-response.config';
import { isUniqueViolation } from '../config/errors/exceptions-handler';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { EventResponseDto } from './dto/event-response.dto';
import { Event } from './entities/event.entity';
import { PinoLogger } from 'nestjs-pino';

@Injectable()
export class EventsService {
  constructor(
    @InjectRepository(Event)
    private readonly eventRepository: Repository<Event>,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(EventsService.name);
  }

  async create(dto: CreateEventDto): Promise<EventResponseDto> {
    if (
      dto.serviceStartsAt != null &&
      dto.serviceEndsAt != null &&
      dto.serviceEndsAt.getTime() <= dto.serviceStartsAt.getTime()
    ) {
      throw new BadRequestException(
        'serviceEndsAt must be after serviceStartsAt',
      );
    }

    const existing = await this.eventRepository.findOne({
      where: { key: dto.key },
    });
    if (existing) {
      throw new ConflictException(EXCEPTION_RESPONSE.EVENT_KEY_ALREADY_EXISTS);
    }
    const existingForContract = await this.eventRepository.findOne({
      where: { contractId: dto.contractId },
    });
    if (existingForContract) {
      throw new ConflictException(
        EXCEPTION_RESPONSE.EVENT_CONTRACT_ALREADY_HAS_EVENT,
      );
    }
    const token = randomUUID();
    const entity = this.eventRepository.create({
      contractId: dto.contractId,
      name: dto.name,
      key: dto.key,
      description: dto.description ?? null,
      token,
      eventTypeId: dto.eventTypeId ?? null,
      honoreesNames: dto.honoreesNames ?? null,
      albumPhrase: dto.albumPhrase ?? null,
      venueName: dto.venueName ?? null,
      serviceLocationUrl: dto.serviceLocationUrl ?? null,
      serviceStartsAt: dto.serviceStartsAt ?? null,
      serviceEndsAt: dto.serviceEndsAt ?? null,
      delegateName: dto.delegateName ?? null,
      eventThemeId: dto.eventThemeId ?? null,
    });
    let saved: Event;
    try {
      saved = await this.eventRepository.save(entity);
    } catch (error) {
      this.logger.error(error, 'Error creating event');
      if (
        isUniqueViolation(error) &&
        error instanceof QueryFailedError &&
        String(error.driverError?.detail ?? '').includes('(contract_id)')
      ) {
        throw new ConflictException(
          EXCEPTION_RESPONSE.EVENT_CONTRACT_ALREADY_HAS_EVENT,
        );
      }
      throw error;
    }
    return plainToInstance(EventResponseDto, saved, {
      excludeExtraneousValues: true,
    });
  }

  async getByToken(token: string): Promise<EventResponseDto> {
    const event = await this.eventRepository.findOne({ where: { token }, relations: { eventTheme: true } });
    if (!event) {
      throw new NotFoundException(EXCEPTION_RESPONSE.EVENT_NOT_FOUND);
    }
    return plainToInstance(EventResponseDto, event, {
      excludeExtraneousValues: true,
    });
  }

  async getByKey(key: string): Promise<EventResponseDto> {
    const event = await this.eventRepository.findOne({ where: { key }, relations: { eventTheme: true } });
    if (!event) {
      throw new NotFoundException(EXCEPTION_RESPONSE.EVENT_NOT_FOUND);
    }
    return plainToInstance(EventResponseDto, event, {
      excludeExtraneousValues: true,
    });
  }

  async list(): Promise<EventResponseDto[]> {
    const events = await this.eventRepository.find({
      order: { createdAt: 'DESC' },
    });
    return events.map((event) =>
      plainToInstance(EventResponseDto, event, {
        excludeExtraneousValues: true,
      }),
    );
  }

  async update(id: number, dto: UpdateEventDto): Promise<EventResponseDto> {
    const event = await this.eventRepository.findOne({ where: { id } });
    if (!event) {
      throw new NotFoundException(EXCEPTION_RESPONSE.EVENT_NOT_FOUND);
    }
    const serviceStartsAt = dto.serviceStartsAt ?? event.serviceStartsAt;
    const serviceEndsAt = dto.serviceEndsAt ?? event.serviceEndsAt;
    if (
      serviceStartsAt != null &&
      serviceEndsAt != null &&
      serviceEndsAt.getTime() <= serviceStartsAt.getTime()
    ) {
      throw new BadRequestException(
        'serviceEndsAt must be after serviceStartsAt',
      );
    }
    Object.assign(event, dto);
    const saved = await this.eventRepository.save(event);
    return plainToInstance(EventResponseDto, saved, {
      excludeExtraneousValues: true,
    });
  }

  async findOneByToken(token: string): Promise<Event> {
    const event = await this.eventRepository.findOne({ where: { token } });
    if (!event) {
      throw new NotFoundException(EXCEPTION_RESPONSE.EVENT_NOT_FOUND);
    }
    return event;
  }

  async findActive(): Promise<Event | null> {
    const now = new Date();
    const cutoff = new Date(now.getTime() - 5 * 60 * 60 * 1000);
    return this.eventRepository
      .createQueryBuilder('event')
      .where('event.serviceStartsAt <= :now', { now })
      .andWhere('event.serviceEndsAt >= :cutoff', { cutoff })
      .getOne();
  }
}
