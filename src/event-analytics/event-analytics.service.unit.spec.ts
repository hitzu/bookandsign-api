import type { Repository } from 'typeorm';

import type { EventAnalytic } from './entities/event-analytic.entity';
import { EventAnalyticsService } from './event-analytics.service';
import { AnalyticsAction } from './enums/analytics-action.enum';
import { AnalyticsSource } from './enums/analytics-source.enum';

describe('EventAnalyticsService (unit)', () => {
  let service: EventAnalyticsService;
  let repo: {
    create: jest.Mock;
    save: jest.Mock;
    findAndCount: jest.Mock;
    createQueryBuilder: jest.Mock;
  };

  beforeEach(() => {
    repo = {
      create: jest.fn((payload) => payload),
      save: jest.fn(),
      findAndCount: jest.fn(),
      createQueryBuilder: jest.fn(),
    };

    service = new EventAnalyticsService(
      repo as unknown as Repository<EventAnalytic>,
    );
  });

  it('persists source for gallery_opened', async () => {
    repo.save.mockResolvedValue(undefined);

    await service.track(
      {
        action: AnalyticsAction.GALLERY_OPENED,
        eventToken: 'a1b2c3d4-0000-0000-0000-000000000000',
        source: AnalyticsSource.QR,
      },
      'Mozilla/5.0 Test',
    );

    expect(repo.save).toHaveBeenCalledWith({
      action: AnalyticsAction.GALLERY_OPENED,
      eventToken: 'a1b2c3d4-0000-0000-0000-000000000000',
      itemCount: null,
      itemIndex: null,
      itemType: null,
      metadata: null,
      personCount: null,
      photoCount: null,
      sessionId: null,
      source: AnalyticsSource.QR,
      surface: null,
      userAgent: 'Mozilla/5.0 Test',
      variant: null,
    });
  });

  it('requires source for gallery_opened', async () => {
    await expect(
      service.track(
        {
          action: AnalyticsAction.GALLERY_OPENED,
          eventToken: 'a1b2c3d4-0000-0000-0000-000000000000',
        },
        'Mozilla/5.0 Test',
      ),
    ).rejects.toThrow('source is required for gallery_opened and session_opened');
  });

  it('requires sessionId for session_opened', async () => {
    await expect(
      service.track(
        {
          action: AnalyticsAction.SESSION_OPENED,
          eventToken: 'a1b2c3d4-0000-0000-0000-000000000000',
          source: AnalyticsSource.GALLERY,
        },
        'Mozilla/5.0 Test',
      ),
    ).rejects.toThrow('sessionId is required for this event');
  });

  it('groups source summary rows by action and source', async () => {
    const queryBuilder = {
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      addGroupBy: jest.fn().mockReturnThis(),
      getRawMany: jest.fn().mockResolvedValue([
        {
          action: AnalyticsAction.GALLERY_OPENED,
          source: AnalyticsSource.QR,
          count: '2',
        },
        {
          action: AnalyticsAction.GALLERY_OPENED,
          source: AnalyticsSource.DIRECT,
          count: '1',
        },
        {
          action: AnalyticsAction.SESSION_OPENED,
          source: AnalyticsSource.GALLERY,
          count: '3',
        },
      ]),
    };
    repo.createQueryBuilder.mockReturnValue(queryBuilder);

    const result = await service.getSourceSummary(
      'a1b2c3d4-0000-0000-0000-000000000000',
    );

    expect(result).toEqual({
      eventToken: 'a1b2c3d4-0000-0000-0000-000000000000',
      actions: {
        gallery_opened: {
          qr: 2,
          gallery: 0,
          photobooth: 0,
          direct: 1,
          sign: 0,
          total: 3,
        },
        session_opened: {
          qr: 0,
          gallery: 3,
          photobooth: 0,
          direct: 0,
          sign: 0,
          total: 3,
        },
      },
    });
  });
});
