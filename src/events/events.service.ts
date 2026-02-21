import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { randomUUID } from 'node:crypto';
import { Repository } from 'typeorm';
import { EXCEPTION_RESPONSE } from '../config/errors/exception-response.config';
import { EventResponseDto } from './dto/event-response.dto';
import { Event } from './entities/event.entity';

@Injectable()
export class EventsService {
  constructor(
    @InjectRepository(Event)
    private readonly eventRepository: Repository<Event>,
  ) {}

  async create(dto: {
    contractId: number;
    name: string;
    key: string;
    description?: string;
  }): Promise<EventResponseDto> {
    const existing = await this.eventRepository.findOne({
      where: { key: dto.key },
    });
    if (existing) {
      throw new ConflictException(EXCEPTION_RESPONSE.EVENT_KEY_ALREADY_EXISTS);
    }
    const token = randomUUID();
    const entity = this.eventRepository.create({
      contractId: dto.contractId,
      name: dto.name,
      key: dto.key,
      description: dto.description ?? null,
      token,
    });
    const saved = await this.eventRepository.save(entity);
    return plainToInstance(EventResponseDto, saved, {
      excludeExtraneousValues: true,
    });
  }

  async getByToken(token: string): Promise<EventResponseDto> {
    const event = await this.eventRepository.findOne({ where: { token } });
    if (!event) {
      throw new NotFoundException(EXCEPTION_RESPONSE.EVENT_NOT_FOUND);
    }
    return plainToInstance(EventResponseDto, event, {
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
}
