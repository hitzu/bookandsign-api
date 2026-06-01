import type { Repository } from 'typeorm';

import type { EventAnalytic } from '../entities/event-analytic.entity';
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
        source: AnalyticsSource.QR_FIESTA,
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
      source: AnalyticsSource.QR_FIESTA,
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
          source: AnalyticsSource.FIESTA_TO_SESSION,
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
          source: AnalyticsSource.QR_FIESTA,
          count: '2',
        },
        {
          action: AnalyticsAction.GALLERY_OPENED,
          source: AnalyticsSource.SESSION_TO_FIESTA,
          count: '1',
        },
        {
          action: AnalyticsAction.SESSION_OPENED,
          source: AnalyticsSource.FIESTA_TO_SESSION,
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
          qr_fiesta: 2,
          qr_inspiracion: 0,
          qr_session: 0,
          qr_printed: 0,
          fiesta_to_session: 0,
          session_to_fiesta: 1,
          photobooth: 0,
          total: 3,
        },
        session_opened: {
          qr_fiesta: 0,
          qr_inspiracion: 0,
          qr_session: 0,
          qr_printed: 0,
          fiesta_to_session: 3,
          session_to_fiesta: 0,
          photobooth: 0,
          total: 3,
        },
      },
    });
  });

  it('requires sessionId for session_expired_viewed', async () => {
    await expect(
      service.track(
        {
          action: AnalyticsAction.SESSION_EXPIRED_VIEWED,
          eventToken: 'a1b2c3d4-0000-0000-0000-000000000000',
        },
        'Mozilla/5.0 Test',
      ),
    ).rejects.toThrow('sessionId is required for this event');
  });

  it('requires sessionId for session_expired_message_clicked', async () => {
    await expect(
      service.track(
        {
          action: AnalyticsAction.SESSION_EXPIRED_MESSAGE_CLICKED,
          eventToken: 'a1b2c3d4-0000-0000-0000-000000000000',
        },
        'Mozilla/5.0 Test',
      ),
    ).rejects.toThrow('sessionId is required for this event');
  });

  it('requires sessionId for session_expired_recovery_requested', async () => {
    await expect(
      service.track(
        {
          action: AnalyticsAction.SESSION_EXPIRED_RECOVERY_REQUESTED,
          eventToken: 'a1b2c3d4-0000-0000-0000-000000000000',
        },
        'Mozilla/5.0 Test',
      ),
    ).rejects.toThrow('sessionId is required for this event');
  });

  it('accepts fiesta_expired_viewed with null sessionId', async () => {
    repo.save.mockResolvedValue(undefined);

    await expect(
      service.track(
        {
          action: AnalyticsAction.FIESTA_EXPIRED_VIEWED,
          eventToken: 'a1b2c3d4-0000-0000-0000-000000000000',
        },
        'Mozilla/5.0 Test',
      ),
    ).resolves.not.toThrow();
  });
});
