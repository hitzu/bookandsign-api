import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { EventType } from "./entities/event-type.entity";
import { PinoLogger } from 'nestjs-pino';
import { plainToInstance } from "class-transformer";
import { EventTypeDto } from "./dto/event-types/event-types.dto";

@Injectable()
export class EventTypeService {
  constructor(
    @InjectRepository(EventType)
    private readonly eventTypeRepository: Repository<EventType>,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(EventTypeService.name);
  }

  async listEventTypes(): Promise<EventTypeDto[]> {
    try {
      const eventTypes = await this.eventTypeRepository.find();
      return eventTypes
        .map((eventType) => plainToInstance(EventTypeDto, eventType, { excludeExtraneousValues: true }));
    } catch (error) {
      this.logger.error(error, 'Error listing event types');
      throw error;
    }
  }
}