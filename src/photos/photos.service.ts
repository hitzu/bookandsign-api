import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { createClient } from '@supabase/supabase-js';
import { plainToInstance } from 'class-transformer';
import { randomUUID } from 'crypto';
import { Brackets, Repository } from 'typeorm';
import { EXCEPTION_RESPONSE } from '../config/errors/exception-response.config';
import { ListPhotosQueryDto } from './dto/list-photos.dto';
import { ListPhotosResponseDto } from './dto/list-photos-response.dto';
import { PhotoResponseDto } from './dto/photo-response.dto';
import { PresignResponseDto } from './dto/presign-response.dto';
import { Photo } from './entities/photo.entity';
import { EventsService } from '../events/events.service';

type PhotoCursor = {
  createdAt: string;
  id: number;
};

type EventPresignUploadInput = {
  eventToken: string;
  fileName: string;
  mime: string;
  storageEnv: string;
};

type EventPresignSegment = 'personalized' | 'devoted';

@Injectable()
export class PhotosService {
  private _client:
    | ReturnType<typeof createClient>
    | undefined;

  constructor(
    @InjectRepository(Photo)
    private readonly photoRepository: Repository<Photo>,
    private readonly eventsService: EventsService,
    private readonly configService: ConfigService,
  ) { }

  private get client() {
    if (this._client) {
      return this._client;
    }

    const url = this.configService.get<string>('SUPABASE_URL');
    const serviceKey = this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY');
    if (!url || !serviceKey) {
      throw new InternalServerErrorException(
        EXCEPTION_RESPONSE.SUPABASE_STORAGE_NOT_CONFIGURED,
      );
    }

    this._client = createClient(url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    return this._client;
  }

  async createStorageUploadUrl(
    bucket: string,
    path: string,
  ): Promise<string> {
    const { data, error } = await this.client.storage
      .from(bucket)
      .createSignedUploadUrl(path);
    if (error || !data?.signedUrl) {
      throw new InternalServerErrorException('Failed to create signed upload URL');
    }
    return data.signedUrl;
  }

  getPublicUrl(bucket: string, path: string): string {
    const baseUrl = this.configService.get<string>('SUPABASE_URL');

    if (!baseUrl) {
      throw new InternalServerErrorException(
        EXCEPTION_RESPONSE.SUPABASE_STORAGE_NOT_CONFIGURED,
      );
    }

    return `${baseUrl.replace(/\/$/, '')}/storage/v1/object/public/${bucket}/${path}`;
  }

  async listByEventToken(
    eventToken: string,
    query: ListPhotosQueryDto,
  ): Promise<ListPhotosResponseDto> {
    const event = await this.eventsService.findOneByToken(eventToken);
    const limit = query.limit ?? 20;
    const cursor = this.decodeCursor(query.cursor);
    const queryBuilder = this.photoRepository
      .createQueryBuilder('photo')
      .where('photo.eventId = :eventId', { eventId: event.id })
      .orderBy('photo.createdAt', 'DESC')
      .addOrderBy('photo.id', 'DESC')
      .take(limit + 1);
    if (cursor) {
      queryBuilder.andWhere(
        new Brackets((qb) => {
          qb.where('photo.createdAt < :cursorCreatedAt', {
            cursorCreatedAt: cursor.createdAt,
          }).orWhere(
            'photo.createdAt = :cursorCreatedAt AND photo.id < :cursorId',
            {
              cursorCreatedAt: cursor.createdAt,
              cursorId: cursor.id,
            },
          );
        }),
      );
    }
    const photos = await queryBuilder.getMany();
    const hasMore = photos.length > limit;
    const pageItems = hasMore ? photos.slice(0, limit) : photos;
    const items = plainToInstance(PhotoResponseDto, pageItems, {
      excludeExtraneousValues: true,
    });
    const lastItem = pageItems[pageItems.length - 1];
    const nextCursor = hasMore && lastItem
      ? this.encodeCursor({
        createdAt: lastItem.createdAt.toISOString(),
        id: lastItem.id,
      })
      : null;
    return {
      items,
      hasMore,
      nextCursor,
    };
  }

  private decodeCursor(cursor?: string): PhotoCursor | null {
    if (!cursor) {
      return null;
    }
    try {
      const decoded = Buffer.from(cursor, 'base64url').toString('utf8');
      const parsed = JSON.parse(decoded) as Partial<PhotoCursor>;
      if (
        !parsed.createdAt
        || typeof parsed.createdAt !== 'string'
        || typeof parsed.id !== 'number'
        || !Number.isInteger(parsed.id)
      ) {
        throw new Error('Invalid cursor payload');
      }
      const createdAt = new Date(parsed.createdAt);
      if (Number.isNaN(createdAt.getTime())) {
        throw new Error('Invalid cursor date');
      }
      return {
        createdAt: createdAt.toISOString(),
        id: parsed.id,
      };
    } catch {
      throw new BadRequestException('Invalid cursor');
    }
  }

  private encodeCursor(cursor: PhotoCursor): string {
    return Buffer.from(JSON.stringify(cursor)).toString('base64url');
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

  async createPersonalizedUploadUrl(
    input: EventPresignUploadInput,
  ): Promise<PresignResponseDto> {
    return this.createEventPresignedUploadUrl(input, 'personalized');
  }

  async createDevotedUploadUrl(
    input: EventPresignUploadInput,
  ): Promise<PresignResponseDto> {
    return this.createEventPresignedUploadUrl(input, 'devoted');
  }

  private async createEventPresignedUploadUrl(
    input: EventPresignUploadInput,
    segment: EventPresignSegment,
  ): Promise<PresignResponseDto> {
    if (input.mime !== 'image/jpeg') {
      throw new BadRequestException('Only image/jpeg is allowed');
    }

    if (!['local', 'prod'].includes(input.storageEnv)) {
      throw new BadRequestException('storageEnv must be local or prod');
    }

    const event = await this.eventsService.findOneByToken(input.eventToken);
    const bucket = input.storageEnv;
    const path = `${segment}/event_${event.id}/${randomUUID()}.jpg`;

    const { data, error } = await this.client.storage
      .from(bucket)
      .createSignedUploadUrl(path);

    if (error || !data?.signedUrl) {
      throw new InternalServerErrorException('Failed to create signed upload URL');
    }

    return plainToInstance(
      PresignResponseDto,
      {
        eventId: event.id,
        bucket,
        path,
        signedUrl: data.signedUrl,
        publicUrl: this.getPublicUrl(bucket, path),
      },
      { excludeExtraneousValues: true },
    );
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

  async listFiles(bucket: string, prefix: string): Promise<string[]> {
    const { data, error } = await this.client.storage
      .from(bucket)
      .list(prefix, { limit: 1000 });
    if (error) return [];
    return (data ?? []).map((f) => `${prefix}/${f.name}`);
  }

  async remove(id: number): Promise<void> {
    const result = await this.photoRepository.softDelete(id);
    if (result.affected === 0) {
      throw new NotFoundException('Photo not found');
    }
  }
}
