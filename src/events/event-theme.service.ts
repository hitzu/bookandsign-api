import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { EventTheme } from "./entities/event-themes.entity";
import { PinoLogger } from "nestjs-pino";
import { EventThemeDto } from './dto/event-theme/event-theme.dto'
import { plainToInstance } from "class-transformer";

@Injectable()
export class EventThemeService {
  constructor(
    @InjectRepository(EventTheme)
    private readonly eventThemeRepository: Repository<EventTheme>,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(EventThemeService.name);
  }

  async listEventThemes(): Promise<EventThemeDto[]> {
    try {
      const eventThemes = await this.eventThemeRepository.find();
      return eventThemes
        .map((eventThemes) => plainToInstance(EventThemeDto, eventThemes, { excludeExtraneousValues: true }));
    } catch (error) {
      this.logger.error(error, 'Error listing event types');
      throw error;
    }
  }

}