import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';

import { Event } from '../events/entities/event.entity';
import { EventsService } from '../events/events.service';
import { Photo } from '../photos/entities/photo.entity';
import { PhotoStatus } from '../photos/enums';
import { Session } from '../photos/entities/session.entity';
import { PhotosService } from '../photos/photos.service';
import { SessionsCache } from '../photos/sessions.cache';
import { ReconciliationService } from './reconciliation.service';

describe('ReconciliationService', () => {
  let service: ReconciliationService;
  let env: { NODE_ENV?: string };
  let photoRepository: {
    find: jest.Mock;
    save: jest.Mock;
  };
  let sessionRepository: {
    increment: jest.Mock;
    findOne: jest.Mock;
  };
  let eventsService: {
    findActive: jest.Mock;
  };
  let photosService: {
    listFiles: jest.Mock;
    getPublicUrl: jest.Mock;
  };
  let configService: Pick<ConfigService, 'get'>;
  let cache: {
    invalidateSession: jest.Mock;
    invalidateGallery: jest.Mock;
  };

  beforeEach(() => {
    env = { NODE_ENV: 'local' };
    photoRepository = {
      find: jest.fn(),
      save: jest.fn(),
    };
    sessionRepository = {
      increment: jest.fn(),
      findOne: jest.fn(),
    };
    eventsService = {
      findActive: jest.fn(),
    };
    photosService = {
      listFiles: jest.fn(),
      getPublicUrl: jest.fn((bucket: string, path: string) => `https://public.example/${bucket}/${path}`),
    };
    configService = {
      get: jest.fn((key: string) => env[key as keyof typeof env]),
    };
    cache = {
      invalidateSession: jest.fn(),
      invalidateGallery: jest.fn(),
    };

    service = new ReconciliationService(
      photoRepository as unknown as Repository<Photo>,
      sessionRepository as unknown as Repository<Session>,
      eventsService as unknown as EventsService,
      photosService as unknown as PhotosService,
      configService as ConfigService,
      cache as unknown as SessionsCache,
    );
  });

  it('should invalidate the gallery cache when a complete session gets reconciled photos', async () => {
    const activeEvent = {
      id: 12,
      token: '1b57a1dd-22da-4f13-ba79-994f860e2ea8',
    } as Event;
    const photo = {
      id: 42,
      eventId: 12,
      sessionId: 7,
      storagePath: 'photobooth/12/reconciled.jpg',
      status: PhotoStatus.PROCESSING,
      publicUrl: null,
    } as Photo;
    const session = {
      id: 7,
      sessionToken: '353f4837-bdf1-4c4d-88c5-f92b5db1cf47',
      status: 'complete',
    } as Session;

    eventsService.findActive.mockResolvedValue(activeEvent);
    photosService.listFiles.mockResolvedValue([photo.storagePath]);
    photoRepository.find.mockResolvedValue([photo]);
    photoRepository.save.mockResolvedValue({
      ...photo,
      status: PhotoStatus.READY,
      publicUrl: 'https://public.example/local/photobooth/12/reconciled.jpg',
    });
    sessionRepository.increment.mockResolvedValue({ affected: 1 });
    sessionRepository.findOne.mockResolvedValue(session);

    await expect(service.reconcile()).resolves.toEqual({ reconciled: 1 });

    expect(photosService.getPublicUrl).toHaveBeenCalledWith('local', photo.storagePath);
    expect(cache.invalidateSession).toHaveBeenCalledWith(session.sessionToken);
    expect(cache.invalidateGallery).toHaveBeenCalledWith(activeEvent.token);
  });

  it('should keep the gallery cache when the reconciled session is still active', async () => {
    const activeEvent = {
      id: 12,
      token: '9bbcd1c4-9f0f-4930-b029-96686c50ad88',
    } as Event;
    const photo = {
      id: 43,
      eventId: 12,
      sessionId: 8,
      storagePath: 'photobooth/12/active.jpg',
      status: PhotoStatus.PROCESSING,
      publicUrl: null,
    } as Photo;
    const session = {
      id: 8,
      sessionToken: '3230c91e-06ff-4846-bf6d-3c703147f80c',
      status: 'active',
    } as Session;

    eventsService.findActive.mockResolvedValue(activeEvent);
    photosService.listFiles.mockResolvedValue([photo.storagePath]);
    photoRepository.find.mockResolvedValue([photo]);
    photoRepository.save.mockResolvedValue({
      ...photo,
      status: PhotoStatus.READY,
      publicUrl: 'https://public.example/local/photobooth/12/active.jpg',
    });
    sessionRepository.increment.mockResolvedValue({ affected: 1 });
    sessionRepository.findOne.mockResolvedValue(session);

    await expect(service.reconcile()).resolves.toEqual({ reconciled: 1 });

    expect(cache.invalidateSession).toHaveBeenCalledWith(session.sessionToken);
    expect(cache.invalidateGallery).not.toHaveBeenCalled();
  });
});
