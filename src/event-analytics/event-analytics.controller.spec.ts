import { Test, type TestingModule } from '@nestjs/testing';
import { EventAnalyticsController } from './event-analytics.controller';
import { EventAnalyticsService } from './event-analytics.service';
import { AnalyticsAction } from './enums/analytics-action.enum';
import { AnalyticsSource } from './enums/analytics-source.enum';
import type { TrackActionDto } from './dto/track-action.dto';

describe('EventAnalyticsController', () => {
  let controller: EventAnalyticsController;
  let trackMock: jest.MockedFunction<EventAnalyticsService['track']>;
  let getSummaryMock: jest.MockedFunction<EventAnalyticsService['getSummary']>;
  let getActionsMock: jest.MockedFunction<EventAnalyticsService['getActions']>;
  let getSourceSummaryMock: jest.MockedFunction<EventAnalyticsService['getSourceSummary']>;

  beforeEach(async () => {
    trackMock = jest.fn();
    getSummaryMock = jest.fn();
    getActionsMock = jest.fn();
    getSourceSummaryMock = jest.fn();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [EventAnalyticsController],
      providers: [
        {
          provide: EventAnalyticsService,
          useValue: {
            track: trackMock,
            getSummary: getSummaryMock,
            getActions: getActionsMock,
            getSourceSummary: getSourceSummaryMock,
          } satisfies Pick<
            EventAnalyticsService,
            'track' | 'getSummary' | 'getActions' | 'getSourceSummary'
          >,
        },
      ],
    }).compile();

    controller = module.get<EventAnalyticsController>(EventAnalyticsController);
  });

  describe('track', () => {
    it('should delegate to EventAnalyticsService.track with dto and userAgent', async () => {
      trackMock.mockResolvedValue(undefined);
      const dto: TrackActionDto = {
        action: AnalyticsAction.GALLERY_OPENED,
        eventToken: 'a1b2c3d4-0000-0000-0000-000000000000',
        source: AnalyticsSource.QR,
      };

      await controller.track(dto, 'Mozilla/5.0 Test');

      expect(trackMock).toHaveBeenCalledTimes(1);
      expect(trackMock).toHaveBeenCalledWith(dto, 'Mozilla/5.0 Test');
    });
  });

  describe('summary', () => {
    it('should delegate to EventAnalyticsService.getSummary', async () => {
      const expected = {
        eventToken: 'token-123',
        totalActions: 5,
        byAction: { download: 5 },
        conversionRates: {
          download_to_cta_modal: '0%',
          download_to_cta_post_download: '0%',
          share_open_to_executed: '0%',
        },
      };
      getSummaryMock.mockResolvedValue(expected);

      const result = await controller.summary('token-123');

      expect(result).toBe(expected);
      expect(getSummaryMock).toHaveBeenCalledTimes(1);
      expect(getSummaryMock).toHaveBeenCalledWith('token-123');
    });
  });

  describe('actions', () => {
    it('should delegate to EventAnalyticsService.getActions with parsed params', async () => {
      const expected = { data: [], total: 0, page: 1, limit: 50 };
      getActionsMock.mockResolvedValue(expected);

      const result = await controller.actions('token-123', 1, 50);

      expect(result).toBe(expected);
      expect(getActionsMock).toHaveBeenCalledTimes(1);
      expect(getActionsMock).toHaveBeenCalledWith('token-123', 1, 50);
    });
  });

  describe('sourceSummary', () => {
    it('should delegate to EventAnalyticsService.getSourceSummary', async () => {
      const expected = {
        eventToken: 'token-123',
        actions: {
          gallery_opened: { qr: 1, gallery: 0, direct: 0, total: 1 },
          session_opened: { qr: 0, gallery: 1, direct: 0, total: 1 },
        },
      };
      getSourceSummaryMock.mockResolvedValue(expected);

      const result = await controller.sourceSummary('token-123');

      expect(result).toBe(expected);
      expect(getSourceSummaryMock).toHaveBeenCalledTimes(1);
      expect(getSourceSummaryMock).toHaveBeenCalledWith('token-123');
    });
  });
});
