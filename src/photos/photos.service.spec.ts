import { NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AppDataSource as TestDataSource } from '../config/database/data-source';
import { EXCEPTION_RESPONSE } from '../config/errors/exception-response.config';
import { EventFactory } from '../../test/factories/events/event.factory';
import { PhotoFactory } from '../../test/factories/photos/photo.factory';
import { Event } from '../events/entities/event.entity';
import { Photo } from './entities/photo.entity';
import { EventsService } from '../events/events.service';
import { PhotosService } from './photos.service';

describe('PhotosService', () => {
  let service: PhotosService;
  let eventFactory: EventFactory;
  let photoFactory: PhotoFactory;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PhotosService,
        EventsService,
        {
          provide: ConfigService,
          useValue: { get: jest.fn((key: string) => (key === 'SUPABASE_URL' ? 'https://test.supabase.co' : undefined)) },
        },
        {
          provide: getRepositoryToken(Photo),
          useValue: TestDataSource.getRepository(Photo),
        },
        {
          provide: getRepositoryToken(Event),
          useValue: TestDataSource.getRepository(Event),
        },
      ],
    }).compile();

    service = module.get<PhotosService>(PhotosService);
    eventFactory = new EventFactory(TestDataSource);
    photoFactory = new PhotoFactory(TestDataSource);
  });

  describe('listByEventToken', () => {
    it('should return photos ordered by createdAt DESC', async () => {
      const event = await eventFactory.create();
      const photo1 = await photoFactory.create({
        eventId: event.id,
        storagePath: 'path1.jpg',
      });
      const photo2 = await photoFactory.create({
        eventId: event.id,
        storagePath: 'path2.jpg',
      });

      const result = await service.listByEventToken(event.token);

      expect(result).toHaveLength(2);
      expect(result[0]?.id).toBe(photo2.id);
      expect(result[1]?.id).toBe(photo1.id);
    });

    it('should throw NotFoundException when event token does not exist', async () => {
      await expect(
        service.listByEventToken('00000000-0000-0000-0000-000000000000'),
      ).rejects.toEqual(
        new NotFoundException(EXCEPTION_RESPONSE.EVENT_NOT_FOUND),
      );
    });

    it('should return empty array when event has no photos', async () => {
      const event = await eventFactory.create();

      const result = await service.listByEventToken(event.token);

      expect(result).toEqual([]);
    });
  });

  describe('create', () => {
    it('should set consentAt in backend and create photo', async () => {
      const event = await eventFactory.create();
      const beforeCreate = new Date();

      const result = await service.create({
        eventToken: event.token,
        storagePath: 'event_6/photo_new.jpg',
        publicUrl: 'https://example.com/photo_new.jpg',
      });

      expect(result.id).toBeDefined();
      expect(result.storagePath).toBe('event_6/photo_new.jpg');
      expect(result.publicUrl).toBe('https://example.com/photo_new.jpg');
      expect(result.consentAt.getTime()).toBeGreaterThanOrEqual(
        beforeCreate.getTime(),
      );
    });

    it('should be idempotent when same event_id and storage_path exist', async () => {
      const event = await eventFactory.create();
      const storagePath = 'event_6/photo_idempotent.jpg';
      const publicUrl = 'https://example.com/idempotent.jpg';

      const first = await service.create({
        eventToken: event.token,
        storagePath,
        publicUrl,
      });

      const second = await service.create({
        eventToken: event.token,
        storagePath,
        publicUrl,
      });

      expect(first.id).toBe(second.id);
      expect(second.id).toBe(first.id);
    });

    it('should throw NotFoundException when event token does not exist', async () => {
      await expect(
        service.create({
          eventToken: '00000000-0000-0000-0000-000000000000',
          storagePath: 'path.jpg',
          publicUrl: 'https://example.com/path.jpg',
        }),
      ).rejects.toEqual(
        new NotFoundException(EXCEPTION_RESPONSE.EVENT_NOT_FOUND),
      );
    });
  });
});
