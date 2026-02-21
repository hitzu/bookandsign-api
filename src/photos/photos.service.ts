import { Injectable } from '@nestjs/common';
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
}
