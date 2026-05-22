import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventAnalytic } from './entities/event-analytic.entity';
import { TrackActionDto } from './dto/track-action.dto';
import { AnalyticsAction } from './enums/analytics-action.enum';
import { AnalyticsSource } from './enums/analytics-source.enum';
import { EXCEPTION_RESPONSE } from '../config/errors/exception-response.config';

type AnalyticsSummaryRow = {
  action: string;
  count: string;
};

type AnalyticsSourceSummaryRow = {
  action: AnalyticsAction;
  source: AnalyticsSource;
  count: string;
};

type SourceActionBreakdown = Record<AnalyticsSource, number> & {
  total: number;
};

const SOURCE_SUMMARY_ACTIONS = [
  AnalyticsAction.GALLERY_OPENED,
  AnalyticsAction.SESSION_OPENED,
];

const TRACKED_SOURCES = [
  AnalyticsSource.QR,
  AnalyticsSource.GALLERY,
  AnalyticsSource.DIRECT,
];

@Injectable()
export class EventAnalyticsService {
  constructor(
    @InjectRepository(EventAnalytic)
    private readonly repo: Repository<EventAnalytic>,
  ) { }

  async track(dto: TrackActionDto, userAgent: string): Promise<void> {
    this.assertTrackRequirements(dto);

    const track = this.repo.create({
      eventToken: dto.eventToken,
      sessionId: dto.sessionId ?? null,
      action: dto.action,
      source: dto.source ?? null,
      surface: dto.surface ?? null,
      itemType: dto.itemType ?? null,
      variant: dto.variant ?? null,
      itemIndex: dto.itemIndex ?? null,
      itemCount: dto.itemCount ?? null,
      photoCount: dto.photoCount ?? null,
      personCount: dto.personCount ?? null,
      metadata: dto.metadata ?? null,
      userAgent: userAgent ?? null,
    });

    await this.repo.save(track)
  }

  async getSummary(eventToken: string) {
    const rows = await this.repo
      .createQueryBuilder('ea')
      .select('ea.action', 'action')
      .addSelect('COUNT(*)', 'count')
      .where('ea.event_token = :eventToken', { eventToken })
      .groupBy('ea.action')
      .getRawMany<AnalyticsSummaryRow>();

    const byAction: Record<string, number> = Object.fromEntries(
      rows.map((r) => [r.action, parseInt(r.count, 10)]),
    );

    const downloads = byAction['download'] || 0;
    const pct = (n: number, d: number) =>
      d ? `${Math.round((n / d) * 100)}%` : '0%';

    return {
      eventToken,
      totalActions: rows.reduce((acc, r) => acc + parseInt(r.count, 10), 0),
      byAction,
      conversionRates: {
        download_to_cta_modal: pct(
          byAction['cta_whatsapp_modal'] || 0,
          downloads,
        ),
        download_to_cta_post_download: pct(
          byAction['cta_whatsapp_post_download'] || 0,
          downloads,
        ),
        share_open_to_executed: pct(
          byAction['share_confirm_executed'] || 0,
          byAction['share_confirm_open'] || 0,
        ),
      },
    };
  }

  async getActions(eventToken: string, page: number, limit: number) {
    const [data, total] = await this.repo.findAndCount({
      where: { eventToken },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total, page, limit };
  }

  async getSourceSummary(eventToken: string) {
    const rows = await this.repo
      .createQueryBuilder('ea')
      .select('ea.action', 'action')
      .addSelect('ea.source', 'source')
      .addSelect('COUNT(*)', 'count')
      .where('ea.event_token = :eventToken', { eventToken })
      .andWhere('ea.action IN (:...actions)', { actions: SOURCE_SUMMARY_ACTIONS })
      .andWhere('ea.source IN (:...sources)', { sources: TRACKED_SOURCES })
      .groupBy('ea.action')
      .addGroupBy('ea.source')
      .getRawMany<AnalyticsSourceSummaryRow>();

    const actions = {
      [AnalyticsAction.GALLERY_OPENED]: this.buildEmptySourceBreakdown(),
      [AnalyticsAction.SESSION_OPENED]: this.buildEmptySourceBreakdown(),
    };

    for (const row of rows) {
      const action = actions[row.action];
      if (!action || !row.source) continue;

      const count = parseInt(row.count, 10);
      action[row.source] = count;
      action.total += count;
    }

    return { eventToken, actions };
  }

  private assertTrackRequirements(dto: TrackActionDto): void {
    const requiresSource =
      dto.action === AnalyticsAction.GALLERY_OPENED ||
      dto.action === AnalyticsAction.SESSION_OPENED;

    if (requiresSource && !dto.source) {
      throw new BadRequestException(EXCEPTION_RESPONSE.REQUIRED_SOURCE,);
    }

    if (dto.action === AnalyticsAction.SESSION_OPENED && !dto.sessionId) {
      throw new BadRequestException(EXCEPTION_RESPONSE.SESSION_ID_REQUIRED);
    }

    const requiresSessionId =
      dto.action === AnalyticsAction.SESSION_STARTED ||
      dto.action === AnalyticsAction.SESSION_COMPLETED;

    if (requiresSessionId && !dto.sessionId) {
      throw new BadRequestException(EXCEPTION_RESPONSE.SESSION_ID_REQUIRED);
    }
  }

  private buildEmptySourceBreakdown(): SourceActionBreakdown {
    return {
      [AnalyticsSource.QR]: 0,
      [AnalyticsSource.GALLERY]: 0,
      [AnalyticsSource.DIRECT]: 0,
      [AnalyticsSource.PHOTOBOOTH]: 0,
      [AnalyticsSource.SIGN]: 0,
      total: 0,
    };
  }
}
