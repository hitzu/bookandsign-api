import { Test, type TestingModule } from '@nestjs/testing';
import { EventAnalyticsController } from './event-analytics.controller';
import { EventAnalyticsService } from './event-analytics.service';
import { AnalyticsAction } from './enums/analytics-action.enum';
import type { TrackActionDto } from './dto/track-action.dto';

describe('EventAnalyticsController', () => {
  let controller: EventAnalyticsController;
  let trackMock: jest.MockedFunction<EventAnalyticsService['track']>;
  let getSummaryMock: jest.MockedFunction<EventAnalyticsService['getSummary']>;
  let getActionsMock: jest.MockedFunction<EventAnalyticsService['getActions']>;

  beforeEach(async () => {
    trackMock = jest.fn();
    getSummaryMock = jest.fn();
    getActionsMock = jest.fn();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [EventAnalyticsController],
      providers: [
        {
          provide: EventAnalyticsService,
          useValue: {
            track: trackMock,
            getSummary: getSummaryMock,
            getActions: getActionsMock,
          } satisfies Pick<EventAnalyticsService, 'track' | 'getSummary' | 'getActions'>,
        },
      ],
    }).compile();

    controller = module.get<EventAnalyticsController>(EventAnalyticsController);
  });

  describe('track', () => {
    it('should delegate to EventAnalyticsService.track with dto and userAgent', async () => {
      trackMock.mockResolvedValue(undefined);
      const dto: TrackActionDto = {
        action: AnalyticsAction.DESCARGAR,
        eventToken: 'a1b2c3d4-0000-0000-0000-000000000000',
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
        byAction: { descargar: 5 },
        conversionRates: {
          descarga_a_cta_modal: '0%',
          descarga_a_cta_post_descarga: '0%',
          share_open_a_ejecutado: '0%',
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
});
