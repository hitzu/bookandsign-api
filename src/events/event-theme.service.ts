import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { EventTheme } from "./entities/event-themes.entity";
import { PinoLogger } from "nestjs-pino";
import { EventThemeDto } from './dto/event-theme/event-theme.dto'
import { plainToInstance } from "class-transformer";
import { createHash } from "node:crypto";
import { EXCEPTION_RESPONSE } from "../config/errors/exception-response.config";
import { Event } from "./entities/event.entity";
import { PublicEventThemeDto, PublicEventThemeResponseDto } from "./dto/event-theme/public-event-theme.dto";
import { CreateEventThemeDto } from "./dto/event-theme/create-event-theme.dto";

const EVENT_THEME_CACHE_CONTROL = 'public, max-age=604800, stale-while-revalidate=2592000';

@Injectable()
export class EventThemeService {
  constructor(
    @InjectRepository(EventTheme)
    private readonly eventThemeRepository: Repository<EventTheme>,
    @InjectRepository(Event)
    private readonly eventRepository: Repository<Event>,
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

  async createEventTheme(dto: CreateEventThemeDto): Promise<EventThemeDto> {
    const existing = await this.eventThemeRepository.findOne({
      where: { key: dto.key },
    });

    if (existing) {
      throw new ConflictException('Event theme key already exists');
    }

    const eventTheme = this.eventThemeRepository.create({
      key: dto.key,
      name: dto.name,
      tokens: dto.tokens ?? null,
    });
    const saved = await this.eventThemeRepository.save(eventTheme);

    return plainToInstance(EventThemeDto, saved, {
      excludeExtraneousValues: true,
    });
  }

  async getPublicThemeByEventToken(token: string): Promise<{
    body: PublicEventThemeResponseDto;
    etag: string;
    cacheControl: string;
  }> {
    const event = await this.eventRepository.findOne({
      where: { token },
      relations: { eventTheme: true },
    });

    if (!event) {
      throw new NotFoundException(EXCEPTION_RESPONSE.EVENT_NOT_FOUND);
    }

    if (!event.eventTheme) {
      throw new NotFoundException('Event theme not found');
    }

    const eventTheme = this.toPublicTheme(event.eventTheme);
    const body = { eventTheme };

    return {
      body,
      etag: this.createEtag(body),
      cacheControl: EVENT_THEME_CACHE_CONTROL,
    };
  }

  isMatchingEtag(ifNoneMatch: string | undefined, etag: string): boolean {
    if (!ifNoneMatch) return false;

    return ifNoneMatch
      .split(',')
      .map((value) => value.trim())
      .some((value) => value === etag || value === `W/${etag}`);
  }

  private toPublicTheme(eventTheme: EventTheme): PublicEventThemeDto {
    return {
      id: eventTheme.id,
      key: eventTheme.key,
      name: eventTheme.name,
      version: eventTheme.updatedAt.toISOString(),
      tokens: eventTheme.tokens,
      images: eventTheme.images,
    };
  }

  private createEtag(body: PublicEventThemeResponseDto): string {
    const hash = createHash('sha256')
      .update(JSON.stringify(body))
      .digest('base64url');

    return `"event-theme-${hash}"`;
  }
}
