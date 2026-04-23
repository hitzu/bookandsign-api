import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Cron } from '@nestjs/schedule';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';

import { EventsService } from '../events/events.service';
import { PhotosService } from '../photos/photos.service';
import { Photo } from '../photos/entities/photo.entity';
import { PhotoStatus } from '../photos/enums';
import { Session } from '../photos/entities/session.entity';
import { SessionsCache } from '../photos/sessions.cache';

@Injectable()
export class ReconciliationService {
  private readonly logger = new Logger(ReconciliationService.name);

  constructor(
    @InjectRepository(Photo)
    private readonly photoRepository: Repository<Photo>,
    @InjectRepository(Session)
    private readonly sessionRepository: Repository<Session>,
    private readonly eventsService: EventsService,
    private readonly photosService: PhotosService,
    private readonly configService: ConfigService,
    private readonly cache: SessionsCache,
  ) { }

  @Cron('*/5 * * * *')
  async reconcile(): Promise<{ reconciled: number }> {
    const activeEvent = await this.eventsService.findActive();
    if (!activeEvent) return { reconciled: 0 };

    const bucket = this.resolveBucket();

    const supabaseFiles = new Set(
      await this.photosService.listFiles(bucket, String('photobooth/' + activeEvent.id)),
    );

    if (supabaseFiles.size === 0) return { reconciled: 0 };

    const processingPhotos = await this.photoRepository.find({
      where: { eventId: activeEvent.id, status: PhotoStatus.PROCESSING },
    });

    let reconciled = 0;

    for (const photo of processingPhotos) {
      if (!supabaseFiles.has(photo.storagePath)) continue;

      photo.publicUrl = this.photosService.getPublicUrl(bucket, photo.storagePath);
      photo.status = PhotoStatus.READY;
      await this.photoRepository.save(photo);

      if (photo.sessionId) {
        await this.sessionRepository.increment(
          { id: photo.sessionId },
          'photoCount',
          1,
        );
        const session = await this.sessionRepository.findOne({
          where: { id: photo.sessionId },
        });
        if (session) this.cache.invalidateSession(session.sessionToken);
      }

      reconciled++;
    }

    if (reconciled > 0) {
      this.logger.log(`Reconciled ${reconciled} photos for event ${activeEvent.id}`);
    }

    return { reconciled };
  }

  private resolveBucket(): string {
    const nodeEnv = this.configService.get<string>('NODE_ENV') ?? 'local';
    return nodeEnv === 'production' ? 'prod' : 'local';
  }
}
