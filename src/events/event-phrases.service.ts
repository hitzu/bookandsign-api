import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { Repository } from 'typeorm';
import { PinoLogger } from 'nestjs-pino';
import { EXCEPTION_RESPONSE } from '../config/errors/exception-response.config';
import { Event } from './entities/event.entity';
import { EventPhrase } from './entities/event-phrases.entity';
import { PhraseByEventTokenDto } from './dto/event-phases/phrase-by-event-token.dto';
import { BulkPhrasesDto } from './dto/event-phases/bulk-phrases.dto';

@Injectable()
export class EventPhrasesService {
  constructor(
    @InjectRepository(Event)
    private readonly eventRepository: Repository<Event>,
    @InjectRepository(EventPhrase)
    private readonly eventPhraseRepository: Repository<EventPhrase>,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(EventPhrasesService.name);
  }

  async listPhrasesByEventToken(
    token: string,
  ): Promise<PhraseByEventTokenDto[]> {
    const event = await this.eventRepository.findOne({ where: { token } });
    if (!event) {
      throw new NotFoundException(EXCEPTION_RESPONSE.EVENT_NOT_FOUND);
    }
    if (!event.eventTypeId) {
      return [];
    }
    const phrases = await this.eventPhraseRepository.find({
      where: { eventTypeId: event.eventTypeId },
    });
    return phrases.map((phrase) =>
      plainToInstance(PhraseByEventTokenDto, phrase, {
        excludeExtraneousValues: true,
      }),
    );
  }

  async bulkSeedPhrases(dto: BulkPhrasesDto) {
    const phrasesToCreate = dto.phrases.map((phrase) => {
      return this.eventPhraseRepository.create({
        eventTypeId: dto.eventTypeId,
        content: phrase
      })
    })
    await this.eventPhraseRepository.save(phrasesToCreate)
  }
}
