import { GalleryResponseDto, SessionResponseDto } from './dto/session-response.dto';
import { SessionsCache } from './sessions.cache';

describe('SessionsCache', () => {
  it('should clear all cached sessions and galleries and return their counts', () => {
    const cache = new SessionsCache();

    cache.setSession('session-token', {
      sessionToken: 'session-token',
      status: 'complete',
      photos: [],
      event: {
        eventToken: 'event-token',
        honoreesNames: 'Alex y Sam',
        date: '2026-05-04T06:00:00',
        albumPhase: 'Nuestro album',
        eventTheme: null,
      },
    } satisfies SessionResponseDto);
    cache.setGallery('event-token', {
      event: {
        eventToken: 'event-token',
        honoreesNames: 'Alex y Sam',
        date: '2026-05-04T06:00:00',
        albumPhase: 'Nuestro album',
        eventTheme: null,
      },
      sessions: [],
    } satisfies GalleryResponseDto);

    expect(cache.clearAll()).toEqual({
      sessions: 1,
      galleries: 1,
    });
    expect(cache.getSession('session-token')).toBeUndefined();
    expect(cache.getGallery('event-token')).toBeUndefined();
  });
});
