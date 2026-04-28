import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AppDataSource as TestDataSource } from '../config/database/data-source';
import { EventFactory } from '../../test/factories/events/event.factory';
import { EventAnalyticFactory } from '../../test/factories/event-analytics/event-analytic.factory';
import { EventAnalytic } from './entities/event-analytic.entity';
import { EventAnalyticsService } from './event-analytics.service';
import { AnalyticsAction } from './enums/analytics-action.enum';

describe('EventAnalyticsService', () => {
  let service: EventAnalyticsService;
  let eventFactory: EventFactory;
  let analyticFactory: EventAnalyticFactory;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventAnalyticsService,
        {
          provide: getRepositoryToken(EventAnalytic),
          useValue: TestDataSource.getRepository(EventAnalytic),
        },
      ],
    }).compile();

    service = module.get<EventAnalyticsService>(EventAnalyticsService);
    eventFactory = new EventFactory(TestDataSource);
    analyticFactory = new EventAnalyticFactory(TestDataSource);
  });

  describe('track', () => {
    it('should persist an analytics record', async () => {
      const event = await eventFactory.create();

      await service.track(
        {
          action: AnalyticsAction.DOWNLOAD,
          eventToken: event.token,
          sessionId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        },
        'Mozilla/5.0 Test',
      );

      const repo = TestDataSource.getRepository(EventAnalytic);
      const rows = await repo.find({ where: { eventToken: event.token } });

      expect(rows).toHaveLength(1);
      expect(rows[0].action).toBe(AnalyticsAction.DOWNLOAD);
      expect(rows[0].sessionId).toBe('a1b2c3d4-e5f6-7890-abcd-ef1234567890');
      expect(rows[0].userAgent).toBe('Mozilla/5.0 Test');
    });

    it('should persist metadata when provided', async () => {
      const event = await eventFactory.create();
      const metadata = { photoId: 'abc-123', format: 'png' };

      await service.track(
        {
          action: AnalyticsAction.CUSTOMIZE,
          eventToken: event.token,
          metadata,
        },
        'TestAgent',
      );

      const repo = TestDataSource.getRepository(EventAnalytic);
      const [row] = await repo.find({ where: { eventToken: event.token } });

      expect(row.metadata).toEqual(metadata);
    });

    it('should default sessionId and metadata to null when not provided', async () => {
      const event = await eventFactory.create();

      await service.track(
        {
          action: AnalyticsAction.DEDICATE,
          eventToken: event.token,
        },
        'TestAgent',
      );

      const repo = TestDataSource.getRepository(EventAnalytic);
      const [row] = await repo.find({ where: { eventToken: event.token } });

      expect(row.sessionId).toBeNull();
      expect(row.metadata).toBeNull();
    });

    it('should allow multiple tracks for the same event', async () => {
      const event = await eventFactory.create();

      await service.track(
        { action: AnalyticsAction.DOWNLOAD, eventToken: event.token },
        'Agent1',
      );
      await service.track(
        { action: AnalyticsAction.DOWNLOAD, eventToken: event.token },
        'Agent2',
      );
      await service.track(
        { action: AnalyticsAction.CTA_WA_MODAL, eventToken: event.token },
        'Agent3',
      );

      const repo = TestDataSource.getRepository(EventAnalytic);
      const rows = await repo.find({ where: { eventToken: event.token } });

      expect(rows).toHaveLength(3);
    });
  });

  describe('getSummary', () => {
    it('should return zeroed summary when no actions exist', async () => {
      const event = await eventFactory.create();

      const result = await service.getSummary(event.token);

      expect(result.eventToken).toBe(event.token);
      expect(result.totalActions).toBe(0);
      expect(result.byAction).toEqual({});
    });

    it('should return correct counts grouped by action', async () => {
      const event = await eventFactory.create();

      await analyticFactory.createForEvent(
        event.token,
        AnalyticsAction.DOWNLOAD,
      );
      await analyticFactory.createForEvent(
        event.token,
        AnalyticsAction.DOWNLOAD,
      );
      await analyticFactory.createForEvent(
        event.token,
        AnalyticsAction.DOWNLOAD,
      );
      await analyticFactory.createForEvent(
        event.token,
        AnalyticsAction.CTA_WA_MODAL,
      );
      await analyticFactory.createForEvent(
        event.token,
        AnalyticsAction.CUSTOMIZE,
      );

      const result = await service.getSummary(event.token);

      expect(result.totalActions).toBe(5);
      expect(result.byAction['download']).toBe(3);
      expect(result.byAction['cta_whatsapp_modal']).toBe(1);
      expect(result.byAction['customize']).toBe(1);
    });

    it('should calculate conversion rates correctly', async () => {
      const event = await eventFactory.create();

      // 10 downloads
      for (let i = 0; i < 10; i++) {
        await analyticFactory.createForEvent(
          event.token,
          AnalyticsAction.DOWNLOAD,
        );
      }
      // 3 cta_whatsapp_modal (30% of downloads)
      for (let i = 0; i < 3; i++) {
        await analyticFactory.createForEvent(
          event.token,
          AnalyticsAction.CTA_WA_MODAL,
        );
      }
      // 2 cta_whatsapp_post_download (20% of downloads)
      for (let i = 0; i < 2; i++) {
        await analyticFactory.createForEvent(
          event.token,
          AnalyticsAction.CTA_WA_POST_DOWNLOAD,
        );
      }
      // 5 share_confirm_open, 3 share_confirm_executed (60%)
      for (let i = 0; i < 5; i++) {
        await analyticFactory.createForEvent(
          event.token,
          AnalyticsAction.SHARE_CONFIRM_OPEN,
        );
      }
      for (let i = 0; i < 3; i++) {
        await analyticFactory.createForEvent(
          event.token,
          AnalyticsAction.SHARE_CONFIRM_EXECUTED,
        );
      }

      const result = await service.getSummary(event.token);

      expect(result.conversionRates.download_to_cta_modal).toBe('30%');
      expect(result.conversionRates.download_to_cta_post_download).toBe('20%');
      expect(result.conversionRates.share_open_to_executed).toBe('60%');
    });

    it('should return 0% conversion when denominator is zero', async () => {
      const event = await eventFactory.create();

      // Only modal clicks, no downloads
      await analyticFactory.createForEvent(
        event.token,
        AnalyticsAction.CTA_WA_MODAL,
      );

      const result = await service.getSummary(event.token);

      expect(result.conversionRates.download_to_cta_modal).toBe('0%');
      expect(result.conversionRates.download_to_cta_post_download).toBe('0%');
    });

    it('should not mix actions from different events', async () => {
      const event1 = await eventFactory.create();
      const event2 = await eventFactory.create();

      await analyticFactory.createForEvent(
        event1.token,
        AnalyticsAction.DOWNLOAD,
      );
      await analyticFactory.createForEvent(
        event1.token,
        AnalyticsAction.DOWNLOAD,
      );
      await analyticFactory.createForEvent(
        event2.token,
        AnalyticsAction.DOWNLOAD,
      );

      const result1 = await service.getSummary(event1.token);
      const result2 = await service.getSummary(event2.token);

      expect(result1.totalActions).toBe(2);
      expect(result2.totalActions).toBe(1);
    });
  });

  describe('getActions', () => {
    it('should return paginated results ordered by createdAt DESC', async () => {
      const event = await eventFactory.create();

      await analyticFactory.createForEvent(
        event.token,
        AnalyticsAction.DOWNLOAD,
      );
      await analyticFactory.createForEvent(
        event.token,
        AnalyticsAction.CUSTOMIZE,
      );
      await analyticFactory.createForEvent(
        event.token,
        AnalyticsAction.DEDICATE,
      );

      const result = await service.getActions(event.token, 1, 2);

      expect(result.data).toHaveLength(2);
      expect(result.total).toBe(3);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(2);
    });

    it('should return second page correctly', async () => {
      const event = await eventFactory.create();

      await analyticFactory.createForEvent(
        event.token,
        AnalyticsAction.DOWNLOAD,
      );
      await analyticFactory.createForEvent(
        event.token,
        AnalyticsAction.CUSTOMIZE,
      );
      await analyticFactory.createForEvent(
        event.token,
        AnalyticsAction.DEDICATE,
      );

      const result = await service.getActions(event.token, 2, 2);

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(3);
      expect(result.page).toBe(2);
    });

    it('should return empty data when no actions exist', async () => {
      const event = await eventFactory.create();

      const result = await service.getActions(event.token, 1, 50);

      expect(result.data).toEqual([]);
      expect(result.total).toBe(0);
    });

    it('should only return actions for the specified event', async () => {
      const event1 = await eventFactory.create();
      const event2 = await eventFactory.create();

      await analyticFactory.createForEvent(
        event1.token,
        AnalyticsAction.DOWNLOAD,
      );
      await analyticFactory.createForEvent(
        event2.token,
        AnalyticsAction.DOWNLOAD,
      );

      const result = await service.getActions(event1.token, 1, 50);

      expect(result.total).toBe(1);
      expect(result.data[0].eventToken).toBe(event1.token);
    });
  });
});
