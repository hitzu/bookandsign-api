import { ConflictException, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';

import { Event } from './entities/event.entity';
import { EventTheme } from './entities/event-themes.entity';
import { EventThemeService } from './event-theme.service';

const amorEternoTokens = {
  background: '#fff5f7',
  primary: '#ec4899',
  onPrimary: '#ffffff',
  secondary: '#a855f7',
  text: '#831843',
  textMuted: '#9ca3af',
  surface: '#fce7f3',
  fontHeading: 'Futura',
  fontBody: 'Inter',
};

describe('EventThemeService', () => {
  let service: EventThemeService;
  let eventThemeRepository: {
    create: jest.Mock;
    find: jest.Mock;
    findOne: jest.Mock;
    save: jest.Mock;
  };
  let eventRepository: { findOne: jest.Mock };

  beforeEach(() => {
    eventThemeRepository = {
      create: jest.fn((value) => value),
      find: jest.fn(),
      findOne: jest.fn(),
      save: jest.fn(),
    };
    eventRepository = {
      findOne: jest.fn(),
    };

    service = new EventThemeService(
      eventThemeRepository as unknown as Repository<EventTheme>,
      eventRepository as unknown as Repository<Event>,
      { setContext: jest.fn(), error: jest.fn() } as any,
    );
  });

  it('creates an event theme with persisted tokens', async () => {
    eventThemeRepository.findOne.mockResolvedValue(null);
    eventThemeRepository.save.mockResolvedValue({
      id: 12,
      key: 'amor-eterno',
      name: 'Amor Eterno',
      tokens: amorEternoTokens,
    });

    const result = await service.createEventTheme({
      key: 'amor-eterno',
      name: 'Amor Eterno',
      tokens: amorEternoTokens,
    });

    expect(eventThemeRepository.create).toHaveBeenCalledWith({
      key: 'amor-eterno',
      name: 'Amor Eterno',
      tokens: amorEternoTokens,
    });
    expect(result).toMatchObject({
      id: 12,
      key: 'amor-eterno',
      name: 'Amor Eterno',
      tokens: amorEternoTokens,
    });
  });

  it('creates an event theme without tokens for manual token setup', async () => {
    eventThemeRepository.findOne.mockResolvedValue(null);
    eventThemeRepository.save.mockResolvedValue({
      id: 13,
      key: 'mis-fotos-oscuro',
      name: 'Mis Fotos Oscuro',
      tokens: null,
    });

    const result = await service.createEventTheme({
      key: 'mis-fotos-oscuro',
      name: 'Mis Fotos Oscuro',
    });

    expect(eventThemeRepository.create).toHaveBeenCalledWith({
      key: 'mis-fotos-oscuro',
      name: 'Mis Fotos Oscuro',
      tokens: null,
    });
    expect(result).toMatchObject({
      id: 13,
      key: 'mis-fotos-oscuro',
      name: 'Mis Fotos Oscuro',
      tokens: null,
    });
  });

  it('rejects duplicated theme keys', async () => {
    eventThemeRepository.findOne.mockResolvedValue({ id: 12 });

    await expect(
      service.createEventTheme({
        key: 'amor-eterno',
        name: 'Amor Eterno',
        tokens: amorEternoTokens,
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('returns the public theme contract from the event theme stored tokens and ETag', async () => {
    eventRepository.findOne.mockResolvedValue({
      id: 1,
      key: 'boda-alex-sam',
      token: 'db69c995-b30b-40b4-85e7-c01a79eff1a1',
      eventTheme: {
        id: 12,
        key: 'amor-eterno',
        name: 'Amor Eterno',
        updatedAt: new Date('2026-06-21T10:00:00.000Z'),
        tokens: amorEternoTokens,
      },
    });

    const result = await service.getPublicThemeByEventToken(
      'db69c995-b30b-40b4-85e7-c01a79eff1a1',
    );

    expect(result.body).toEqual({
      eventTheme: {
        id: 12,
        key: 'amor-eterno',
        name: 'Amor Eterno',
        version: '2026-06-21T10:00:00.000Z',
        tokens: amorEternoTokens,
      },
    });
    expect(result.etag).toMatch(/^"event-theme-.+"$/);
    expect(result.cacheControl).toBe('public, max-age=604800, stale-while-revalidate=2592000');
  });

  it('throws NotFoundException when the event has no theme', async () => {
    eventRepository.findOne.mockResolvedValue({
      id: 2,
      key: 'mis-fotos-demo',
      token: 'db69c995-b30b-40b4-85e7-c01a79eff1a1',
      eventTheme: null,
    });

    await expect(
      service.getPublicThemeByEventToken('db69c995-b30b-40b4-85e7-c01a79eff1a1'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('matches strong and weak If-None-Match values', () => {
    expect(service.isMatchingEtag('"abc", "event-theme-123"', '"event-theme-123"')).toBe(true);
    expect(service.isMatchingEtag('W/"event-theme-123"', '"event-theme-123"')).toBe(true);
    expect(service.isMatchingEtag('"other"', '"event-theme-123"')).toBe(false);
  });

  it('throws NotFoundException when the event token does not exist', async () => {
    eventRepository.findOne.mockResolvedValue(null);

    await expect(service.getPublicThemeByEventToken('missing-token')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
