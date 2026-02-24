import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { Repository } from 'typeorm';
import { PhotoResponseDto } from './dto/photo-response.dto';
import { Photo } from './entities/photo.entity';
import { EventsService } from '../events/events.service';

@Injectable()
export class PhotosService {
  constructor(
    @InjectRepository(Photo)
    private readonly photoRepository: Repository<Photo>,
    private readonly eventsService: EventsService,
    private readonly configService: ConfigService,
  ) { }

  async listByEventToken(eventToken: string): Promise<PhotoResponseDto[]> {
    const event = await this.eventsService.findOneByToken(eventToken);
    const photos = await this.photoRepository.find({
      where: { eventId: event.id },
      order: { createdAt: 'DESC' },
    });
    return plainToInstance(PhotoResponseDto, photos, {
      excludeExtraneousValues: true,
    });
  }

  async create(dto: {
    eventToken: string;
    storagePath: string;
    publicUrl: string;
  }): Promise<PhotoResponseDto> {
    const event = await this.eventsService.findOneByToken(dto.eventToken);
    const existing = await this.photoRepository.findOne({
      where: { eventId: event.id, storagePath: dto.storagePath },
    });
    if (existing) {
      return plainToInstance(PhotoResponseDto, existing, {
        excludeExtraneousValues: true,
      });
    }
    const consentAt = new Date();
    const entity = this.photoRepository.create({
      eventId: event.id,
      storagePath: dto.storagePath,
      publicUrl: dto.publicUrl,
      consentAt,
    });
    const saved = await this.photoRepository.save(entity);
    return plainToInstance(PhotoResponseDto, saved, {
      excludeExtraneousValues: true,
    });
  }

  /**
   * [TEST ONLY - Remove manually] Seeds N photos (1.jpg to N.jpg) for an event.
   * Use for bulk testing without Bruno's paid Run with Parameters.
   */
  async bulkSeed(dto: {
    eventToken: string;
    storageBase?: string;
    count?: number;
  }): Promise<PhotoResponseDto[]> {
    const storageBase = dto.storageBase ?? 'local/photobooth/event_1';
    const count = dto.count ?? 82;
    const event = await this.eventsService.findOneByToken(dto.eventToken);

    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const publicUrlBase = supabaseUrl
      ? `${supabaseUrl.replace(/\/$/, '')}/storage/v1/object/public`
      : 'https://uljzbxuxzknilubykrlw.supabase.co/storage/v1/object/public';

    const results: PhotoResponseDto[] = [];
    const consentAt = new Date();

    for (let i = 1; i <= count; i++) {
      const fileName = `${i}.jpg`;
      const storagePath = `${storageBase}/${fileName}`;
      const publicUrl = `${publicUrlBase}/${storagePath}`;

      const existing = await this.photoRepository.findOne({
        where: { eventId: event.id, storagePath },
      });
      if (existing) {
        results.push(
          plainToInstance(PhotoResponseDto, existing, {
            excludeExtraneousValues: true,
          }),
        );
        continue;
      }

      const entity = this.photoRepository.create({
        eventId: event.id,
        storagePath,
        publicUrl,
        consentAt,
      });
      const saved = await this.photoRepository.save(entity);
      results.push(
        plainToInstance(PhotoResponseDto, saved, {
          excludeExtraneousValues: true,
        }),
      );
    }

    return results;
  }
}
