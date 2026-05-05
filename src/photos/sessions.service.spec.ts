import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';

import { PhotoStatus } from './enums';
import { Photo } from './entities/photo.entity';
import { Session } from './entities/session.entity';
import { PhotosService } from './photos.service';
import { SessionsCache } from './sessions.cache';
import { SessionsService } from './sessions.service';

jest.mock('node:crypto', () => ({
  randomUUID: jest.fn(() => 'uuid-123'),
}));

describe('SessionsService', () => {
  let service: SessionsService;
  let sessionRepository: {
    findOne: jest.Mock;
    increment: jest.Mock;
  };
  let photoRepository: {
    create: jest.Mock;
    save: jest.Mock;
    find: jest.Mock;
    findOne: jest.Mock;
  };
  let photosService: {
    createStorageUploadUrl: jest.Mock;
    getPublicUrl: jest.Mock;
  };
  let configService: Pick<ConfigService, 'get'>;
  let cache: {
    getSession: jest.Mock;
    setSession: jest.Mock;
    invalidateSession: jest.Mock;
    getGallery: jest.Mock;
    setGallery: jest.Mock;
    invalidateGallery: jest.Mock;
  };

  beforeEach(() => {
    sessionRepository = {
      findOne: jest.fn(),
      increment: jest.fn(),
    };
    photoRepository = {
      create: jest.fn((value) => value),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
    };
    photosService = {
      createStorageUploadUrl: jest.fn(),
      getPublicUrl: jest.fn((bucket: string, path: string) => `https://public.example/${bucket}/${path}`),
    };
    configService = {
      get: jest.fn((key: string) => {
        if (key === 'NODE_ENV') {
          return 'local';
        }

        return undefined;
      }),
    };
    cache = {
      getSession: jest.fn(() => null),
      setSession: jest.fn(),
      invalidateSession: jest.fn(),
      getGallery: jest.fn(() => null),
      setGallery: jest.fn(),
      invalidateGallery: jest.fn(),
    };

    service = new SessionsService(
      sessionRepository as unknown as Repository<Session>,
      photoRepository as unknown as Repository<Photo>,
      {} as never,
      photosService as unknown as PhotosService,
      configService as ConfigService,
      cache as unknown as SessionsCache,
    );
  });

  it('should create a processing photo row for GIF uploads via photos/presigned', async () => {
    const session = {
      id: 7,
      sessionToken: '5c95cf10-7e7e-4101-aa24-b7a4d3145df4',
      eventId: 12,
      event: { id: 12 },
    } as Session;
    const savedPhoto = {
      id: 99,
      eventId: 12,
      sessionId: 7,
      storagePath: 'photobooth/12/uuid-123.gif',
      publicUrl: null,
      consentAt: new Date(),
      status: PhotoStatus.PROCESSING,
    } as Photo;

    sessionRepository.findOne.mockResolvedValue(session);
    photosService.createStorageUploadUrl.mockResolvedValue('https://signed.example/upload');
    photoRepository.save.mockResolvedValue(savedPhoto);

    const result = await service.getPresignedUploadUrl({
      sessionToken: session.sessionToken,
      storageEnv: 'prod',
      mime: 'image/gif',
    });

    expect(photosService.createStorageUploadUrl).toHaveBeenCalledWith(
      'prod',
      'photobooth/12/uuid-123.gif',
    );
    expect(photoRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        eventId: 12,
        sessionId: 7,
        storagePath: 'photobooth/12/uuid-123.gif',
        publicUrl: null,
        status: PhotoStatus.PROCESSING,
      }),
    );
    expect(result).toEqual({
      photoId: 99,
      presignedUrl: 'https://signed.example/upload',
      photoPath: 'prod/photobooth/12/uuid-123.gif',
    });
  });

  it('should reject unsupported mimes for photos/presigned', async () => {
    const session = {
      id: 7,
      sessionToken: '5c95cf10-7e7e-4101-aa24-b7a4d3145df4',
      eventId: 12,
      event: { id: 12 },
    } as Session;

    sessionRepository.findOne.mockResolvedValue(session);

    await expect(
      service.getPresignedUploadUrl({
        sessionToken: session.sessionToken,
        storageEnv: 'prod',
        mime: 'image/png',
      }),
    ).rejects.toEqual(new BadRequestException('Only image/jpeg and image/gif are allowed'));
  });

  it('should confirm a GIF photo row without changing the confirm contract', async () => {
    const photo = {
      id: 42,
      eventId: 12,
      sessionId: 7,
      storagePath: 'photobooth/12/gif-upload.gif',
      publicUrl: null,
      consentAt: new Date(),
      status: PhotoStatus.PROCESSING,
    } as Photo;
    const savedPhoto = {
      ...photo,
      publicUrl: 'https://public.example/local/photobooth/12/gif-upload.gif',
      status: PhotoStatus.READY,
    } as Photo;
    const session = {
      id: 7,
      sessionToken: 'ce0b5bb4-a448-441a-a48a-a7c2cf32d282',
    } as Session;

    photoRepository.findOne.mockResolvedValueOnce(photo).mockResolvedValueOnce(savedPhoto);
    photoRepository.save.mockResolvedValue(savedPhoto);
    sessionRepository.findOne.mockResolvedValue(session);
    sessionRepository.increment.mockResolvedValue({ affected: 1 });

    await expect(service.confirmPhotoV2({ photoId: 42 })).resolves.toEqual({ ok: true });

    expect(photosService.getPublicUrl).toHaveBeenCalledWith(
      'local',
      'photobooth/12/gif-upload.gif',
    );
    expect(photoRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 42,
        publicUrl: 'https://public.example/local/photobooth/12/gif-upload.gif',
        status: PhotoStatus.READY,
      }),
    );
    expect(sessionRepository.increment).toHaveBeenCalledWith({ id: 7 }, 'photoCount', 1);
    expect(cache.invalidateSession).toHaveBeenCalledWith(session.sessionToken);
  });

  it('should not append the synthetic session GIF when a real GIF photo already exists', async () => {
    const session = {
      id: 7,
      sessionToken: '9abfe43e-30d9-4614-a0b2-c4ef6ed3a76f',
      eventId: 12,
      status: 'complete',
      event: {
        id: 12,
        token: '6f01177a-d7ef-4342-a6e1-618da5230a06',
        honoreesNames: 'Alex y Sam',
        serviceStartsAt: new Date('2026-05-04T12:00:00.000Z'),
        albumPhrase: 'Nuestro album',
        eventTheme: null,
      },
    } as Session;
    const readyPhotos = [
      {
        id: 1,
        storagePath: 'photobooth/12/uuid-123.jpg',
        publicUrl: 'https://public.example/local/photobooth/12/uuid-123.jpg',
      },
      {
        id: 2,
        storagePath: 'photobooth/12/uuid-123.gif',
        publicUrl: 'https://public.example/local/photobooth/12/uuid-123.gif',
      },
    ] as Photo[];

    sessionRepository.findOne.mockResolvedValue(session);
    photoRepository.find.mockResolvedValue(readyPhotos);

    const result = await service.getSession(session.sessionToken);

    expect(result.photos).toEqual([
      {
        url: 'https://public.example/local/photobooth/12/uuid-123.jpg',
        position: 1,
      },
      {
        url: 'https://public.example/local/photobooth/12/uuid-123.gif',
        position: 2,
      },
    ]);
    expect(photosService.getPublicUrl).not.toHaveBeenCalled();
  });
});
