import {
  ConflictException,
  GoneException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'node:crypto';
import { plainToInstance } from 'class-transformer';
import { Repository } from 'typeorm';

import { EXCEPTION_RESPONSE } from '../config/errors/exception-response.config';
import { EventsService } from '../events/events.service';
import { Event } from '../events/entities/event.entity';
import { Photo } from './entities/photo.entity';
import { PhotoStatus } from './enums';
import { Session } from './entities/session.entity';
import {
  CreateSessionResponseDto,
  GalleryResponseDto,
  ListSessionsResponseDto,
  SessionDetailResponseDto,
  SessionListItemDto,
  SessionPhotoDto,
  SessionResponseDto,
} from './dto/session-response.dto';
import { SessionUploadUrlResponseDto } from './dto/create-session-upload-url.dto';
import { ConfirmPhotoDto } from './dto/confirm-photo.dto';
import { PresignedUploadDto, PresignedUploadResponseDto } from './dto/presigned-upload.dto';
import { PhotoResponseDto } from './dto/photo-response.dto';
import { PhotosService } from './photos.service';
import { SessionsCache } from './sessions.cache';

const EVENT_EXPIRATION_DAYS = 15;
const MS_PER_DAY = 24 * 60 * 60 * 1000;
const UPLOAD_URL_TTL_SECONDS = 300;
const ALLOWED_MIMES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
};

@Injectable()
export class SessionsService {
  constructor(
    @InjectRepository(Session)
    private readonly sessionRepository: Repository<Session>,
    @InjectRepository(Photo)
    private readonly photoRepository: Repository<Photo>,
    private readonly eventsService: EventsService,
    private readonly photosService: PhotosService,
    private readonly configService: ConfigService,
    private readonly cache: SessionsCache,
  ) { }

  // ── Legacy endpoints ──────────────────────────────────────────────────────────

  async create(
    eventToken: string,
    sessionToken: string,
  ): Promise<CreateSessionResponseDto> {
    const event = await this.eventsService.findOneByToken(eventToken);

    const existing = await this.sessionRepository.findOne({
      where: { sessionToken },
    });
    if (existing) {
      throw new ConflictException(EXCEPTION_RESPONSE.SESSION_ALREADY_EXISTS);
    }

    const entity = this.sessionRepository.create({
      sessionToken,
      eventId: event.id,
    });
    const saved = await this.sessionRepository.save(entity);

    return {
      id_session: saved.sessionToken,
      event_token: event.token,
      created_at: saved.createdAt,
    };
  }

  async listByEvent(eventToken: string): Promise<ListSessionsResponseDto> {
    const event = await this.eventsService.findOneByToken(eventToken);
    this.assertEventNotExpired(event);

    const sessions = await this.sessionRepository
      .createQueryBuilder('session')
      .where('session.eventId = :eventId', { eventId: event.id })
      .orderBy('session.createdAt', 'DESC')
      .getMany();

    if (sessions.length === 0) {
      return { event_token: event.token, session_count: 0, sessions: [] };
    }

    const sessionPks = sessions.map((s) => s.id);
    const photos = await this.photoRepository
      .createQueryBuilder('photo')
      .where('photo.sessionId IN (:...sessionPks)', { sessionPks })
      .andWhere('photo.status = :ready', { ready: PhotoStatus.READY })
      .orderBy('photo.createdAt', 'ASC')
      .addOrderBy('photo.id', 'ASC')
      .getMany();

    const photosBySession = new Map<number, Photo[]>();
    for (const photo of photos) {
      if (photo.sessionId == null) continue;
      const list = photosBySession.get(photo.sessionId) ?? [];
      list.push(photo);
      photosBySession.set(photo.sessionId, list);
    }

    const items: SessionListItemDto[] = sessions.map((session) => {
      const sessionPhotos = photosBySession.get(session.id) ?? [];
      const firstReady = sessionPhotos[0];
      const createdAt = firstReady?.createdAt ?? session.createdAt;
      const coverUrl = firstReady?.publicUrl ?? null;
      return {
        id_session: session.sessionToken,
        created_at: createdAt,
        cover_url: coverUrl,
        photo_count: sessionPhotos.length,
      };
    });

    items.sort((a, b) => b.created_at.getTime() - a.created_at.getTime());

    return {
      event_token: event.token,
      session_count: items.length,
      sessions: items,
    };
  }

  async findOne(
    eventToken: string,
    sessionToken: string,
  ): Promise<SessionDetailResponseDto> {
    const event = await this.eventsService.findOneByToken(eventToken);
    this.assertEventNotExpired(event);

    const session = await this.sessionRepository.findOne({
      where: { sessionToken, eventId: event.id },
    });
    if (!session) {
      throw new NotFoundException(EXCEPTION_RESPONSE.SESSION_NOT_FOUND);
    }

    const [readyPhotos, processingCount] = await Promise.all([
      this.photoRepository
        .createQueryBuilder('photo')
        .where('photo.sessionId = :sessionPk', { sessionPk: session.id })
        .andWhere('photo.status = :ready', { ready: PhotoStatus.READY })
        .orderBy('photo.createdAt', 'ASC')
        .addOrderBy('photo.id', 'ASC')
        .getMany(),
      this.photoRepository
        .createQueryBuilder('photo')
        .where('photo.sessionId = :sessionPk', { sessionPk: session.id })
        .andWhere('photo.status = :processing', { processing: PhotoStatus.PROCESSING })
        .getCount(),
    ]);

    const photoDtos: SessionPhotoDto[] = readyPhotos.map((p) => ({
      photo_id: p.id,
      status: p.status,
      url: p.publicUrl,
      created_at: p.createdAt,
    }));

    return {
      id_session: session.sessionToken,
      event_token: event.token,
      allReady: processingCount === 0,
      photos: photoDtos,
    };
  }

  async createUploadUrl(
    eventToken: string,
    sessionToken: string,
    input: { fileName: string; mime: string },
  ): Promise<SessionUploadUrlResponseDto> {
    const extension = ALLOWED_MIMES[input.mime];
    if (!extension) {
      throw new NotFoundException('Unsupported mime type');
    }

    const event = await this.eventsService.findOneByToken(eventToken);
    this.assertEventNotExpired(event);

    const session = await this.sessionRepository.findOne({
      where: { sessionToken, eventId: event.id },
    });
    if (!session) {
      throw new NotFoundException(EXCEPTION_RESPONSE.SESSION_NOT_FOUND);
    }

    const bucket = this.resolveBucket();
    const storagePath = `${event.id}/${randomUUID()}.${extension}`;

    const signedUrl = await this.photosService.createStorageUploadUrl(bucket, storagePath);

    const photoEntity = this.photoRepository.create({
      eventId: event.id,
      sessionId: session.id,
      storagePath,
      publicUrl: null,
      consentAt: new Date(),
      status: PhotoStatus.PROCESSING,
    });
    const saved = await this.photoRepository.save(photoEntity);

    return {
      photo_id: saved.id,
      upload_url: signedUrl,
      storage_path: storagePath,
      expires_in: UPLOAD_URL_TTL_SECONDS,
    };
  }

  async confirmPhoto(eventToken: string, photoId: number): Promise<PhotoResponseDto> {
    const event = await this.eventsService.findOneByToken(eventToken);
    this.assertEventNotExpired(event);

    const photo = await this.photoRepository.findOne({
      where: { id: photoId, eventId: event.id },
    });
    if (!photo) throw new NotFoundException('Photo not found');

    if (photo.status === PhotoStatus.READY && photo.publicUrl) {
      return plainToInstance(PhotoResponseDto, photo, { excludeExtraneousValues: true });
    }

    const bucket = this.resolveBucket();
    photo.publicUrl = this.photosService.getPublicUrl(bucket, photo.storagePath);
    photo.status = PhotoStatus.READY;
    const saved = await this.photoRepository.save(photo);

    return plainToInstance(PhotoResponseDto, saved, { excludeExtraneousValues: true });
  }

  async failPhoto(eventToken: string, photoId: number): Promise<PhotoResponseDto> {
    const event = await this.eventsService.findOneByToken(eventToken);
    this.assertEventNotExpired(event);

    const photo = await this.photoRepository.findOne({
      where: { id: photoId, eventId: event.id },
    });
    if (!photo) throw new NotFoundException('Photo not found');

    if (photo.status !== PhotoStatus.ERROR) {
      photo.status = PhotoStatus.ERROR;
      await this.photoRepository.save(photo);
    }

    return plainToInstance(PhotoResponseDto, photo, { excludeExtraneousValues: true });
  }

  // ── v2 endpoints ──────────────────────────────────────────────────────────────

  async createSession(
    sessionToken: string,
    eventToken: string,
  ): Promise<{ sessionToken: string }> {
    const event = await this.eventsService.findOneByToken(eventToken);

    const existing = await this.sessionRepository.findOne({ where: { sessionToken } });
    if (existing) {
      throw new ConflictException(EXCEPTION_RESPONSE.SESSION_ALREADY_EXISTS);
    }

    await this.sessionRepository.save(
      this.sessionRepository.create({ sessionToken, eventId: event.id }),
    );

    return { sessionToken };
  }

  async completeSession(sessionToken: string): Promise<{ ok: boolean }> {
    const session = await this.sessionRepository.findOne({
      where: { sessionToken },
      relations: ['event'],
    });
    if (!session) {
      throw new NotFoundException(EXCEPTION_RESPONSE.SESSION_NOT_FOUND);
    }

    await this.sessionRepository.update(
      { sessionToken },
      { status: 'complete', completedAt: new Date() },
    );

    this.cache.invalidateGallery(session.event!.token);
    return { ok: true };
  }

  async getSession(sessionToken: string): Promise<SessionResponseDto> {
    const cached = this.cache.getSession(sessionToken);
    if (cached) return cached;

    const session = await this.sessionRepository.findOne({
      where: { sessionToken },
      relations: ['event'],
    });
    if (!session) {
      throw new NotFoundException(EXCEPTION_RESPONSE.SESSION_NOT_FOUND);
    }

    const photos = await this.photoRepository.find({
      where: { sessionId: session.id, status: PhotoStatus.READY },
      order: { createdAt: 'ASC' },
    });

    const result: SessionResponseDto = {
      sessionToken: session.sessionToken,
      status: session.status,
      photos: photos.map((p) => ({ url: p.publicUrl ?? '', position: p.id })),
      event: {
        honoreesNames: session.event?.honoreesNames ?? '',
        date: session.event?.serviceStartsAt?.toISOString() ?? '',
      },
    };

    if (session.status === 'complete') {
      this.cache.setSession(sessionToken, result);
    }

    return result;
  }

  async getGallery(eventToken: string): Promise<GalleryResponseDto> {
    const cached = this.cache.getGallery(eventToken);
    if (cached) return cached;

    const event = await this.eventsService.findOneByToken(eventToken);

    const sessions = await this.sessionRepository.find({
      where: { eventId: event.id, status: 'complete' },
      order: { createdAt: 'DESC' },
    });

    const sessionIds = sessions.map((s) => s.id);
    const coverPhotos = sessionIds.length
      ? await this.photoRepository
        .createQueryBuilder('photo')
        .where('photo.sessionId IN (:...sessionIds)', { sessionIds })
        .andWhere('photo.status = :ready', { ready: PhotoStatus.READY })
        .orderBy('photo.sessionId')
        .addOrderBy('photo.createdAt', 'ASC')
        .getMany()
      : [];

    const firstPhotoBySession = new Map<number, Photo>();
    for (const photo of coverPhotos) {
      if (photo.sessionId && !firstPhotoBySession.has(photo.sessionId)) {
        firstPhotoBySession.set(photo.sessionId, photo);
      }
    }

    const result: GalleryResponseDto = {
      event: {
        honoreesNames: event.honoreesNames ?? '',
        date: event.serviceStartsAt?.toISOString() ?? '',
      },
      sessions: sessions.map((s) => ({
        sessionToken: s.sessionToken,
        coverPhoto: firstPhotoBySession.get(s.id)?.publicUrl ?? '',
        photoCount: s.photoCount,
      })),
    };

    this.cache.setGallery(eventToken, result);
    return result;
  }

  async getPresignedUploadUrl(dto: PresignedUploadDto): Promise<PresignedUploadResponseDto> {
    const session = await this.sessionRepository.findOne({
      where: { sessionToken: dto.sessionToken },
      relations: ['event'],
    });
    if (!session) {
      throw new NotFoundException(EXCEPTION_RESPONSE.SESSION_NOT_FOUND);
    }

    const bucket = this.resolveBucket();
    const storagePath = `photobooth/${session.event!.id}/${randomUUID()}.jpg`;
    const presignedUrl = await this.photosService.createStorageUploadUrl(bucket, storagePath);

    const photo = await this.photoRepository.save(
      this.photoRepository.create({
        eventId: session.event!.id,
        sessionId: session.id,
        storagePath,
        publicUrl: null,
        consentAt: new Date(),
        status: PhotoStatus.PROCESSING,
      }),
    );

    return { photoId: photo.id, presignedUrl, photoPath: storagePath };
  }

  async confirmPhotoV2(dto: ConfirmPhotoDto): Promise<{ ok: boolean }> {
    const photo = await this.photoRepository.findOne({ where: { id: dto.photoId } });
    if (!photo) throw new NotFoundException('Photo not found');

    if (photo.status === PhotoStatus.READY) return { ok: true };

    const bucket = this.resolveBucket();
    photo.publicUrl = this.photosService.getPublicUrl(bucket, photo.storagePath);
    photo.status = PhotoStatus.READY;
    await this.photoRepository.save(photo);

    await this.sessionRepository.increment(
      { id: photo.sessionId ?? -1 },
      'photoCount',
      1,
    );

    if (photo.sessionId) {
      const session = await this.sessionRepository.findOne({ where: { id: photo.sessionId } });
      if (session) this.cache.invalidateSession(session.sessionToken);
    }

    return { ok: true };
  }

  private resolveBucket(): string {
    const nodeEnv = this.configService.get<string>('NODE_ENV') ?? 'local';
    return nodeEnv === 'production' ? 'prod' : 'local';
  }

  private assertEventNotExpired(event: Event): void {
    const expiresAt = new Date(
      event.createdAt.getTime() + EVENT_EXPIRATION_DAYS * MS_PER_DAY,
    );
    if (Date.now() > expiresAt.getTime()) {
      throw new GoneException(EXCEPTION_RESPONSE.EVENT_EXPIRED);
    }
  }
}
