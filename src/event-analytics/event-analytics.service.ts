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

  async getDashboard(eventToken: string) {
    const [
      funnel,
      duration,
      groupSize,
      trafficSource,
      surfaceEngagement,
      sessionsByHour,
      sessionEngagement,
      postExpiration,
    ] = await Promise.all([
      this.queryFunnel(eventToken),
      this.queryDuration(eventToken),
      this.queryGroupSize(eventToken),
      this.queryTrafficSource(eventToken),
      this.querySurfaceEngagement(eventToken),
      this.querySessionsByHour(eventToken),
      this.querySessionEngagement(eventToken),
      this.queryPostExpiration(eventToken),
    ]);

    return {
      eventToken,
      funnel,
      duration,
      groupSize,
      trafficSource,
      surfaceEngagement,
      sessionsByHour,
      sessionEngagement,
      postExpiration,
    };
  }

  private async queryFunnel(eventToken: string) {
    const rows = await this.repo
      .createQueryBuilder('ea')
      .select('ea.action', 'action')
      .addSelect('COUNT(*)', 'count')
      .where('ea.event_token = :eventToken', { eventToken })
      .andWhere('ea.action IN (:...actions)', {
        actions: ['gallery_opened', 'gallery_view', 'session_view', 'download', 'share_confirm_executed'],
      })
      .groupBy('ea.action')
      .getRawMany<{ action: string; count: string }>();

    const byAction: Record<string, number> = Object.fromEntries(
      rows.map((r) => [r.action, parseInt(r.count, 10)]),
    );

    return {
      galleryOpens: byAction['gallery_opened'] ?? 0,
      galleryViews: byAction['gallery_view'] ?? 0,
      sessionViews: byAction['session_view'] ?? 0,
      conversions: (byAction['download'] ?? 0) + (byAction['share_confirm_executed'] ?? 0),
    };
  }

  private async queryDuration(eventToken: string) {
    const row = await this.repo.manager.query<{
      avg_seconds: string;
      median_seconds: string;
      completed_sessions: string;
    }[]>(`
      SELECT
        ROUND(AVG(EXTRACT(EPOCH FROM (c.created_at - s.created_at))))::TEXT  AS avg_seconds,
        PERCENTILE_CONT(0.5) WITHIN GROUP (
          ORDER BY EXTRACT(EPOCH FROM (c.created_at - s.created_at))
        )::TEXT                                                              AS median_seconds,
        COUNT(*)::TEXT                                                       AS completed_sessions
      FROM event_analytics s
      JOIN event_analytics c ON s.session_id = c.session_id
      WHERE s.action      = 'session_started'
        AND c.action      = 'session_completed'
        AND s.event_token = $1
    `, [eventToken]);

    const r = row[0];
    return {
      completedSessions: parseInt(r?.completed_sessions ?? '0', 10),
      avgSeconds: parseFloat(r?.avg_seconds ?? '0'),
      medianSeconds: parseFloat(r?.median_seconds ?? '0'),
    };
  }

  private async queryGroupSize(eventToken: string) {
    const rows = await this.repo.manager.query<{ person_count: string; sessions: string }[]>(`
      SELECT person_count, COUNT(*) AS sessions
      FROM event_analytics
      WHERE event_token = $1
        AND action      = 'session_completed'
      GROUP BY person_count
      ORDER BY person_count
    `, [eventToken]);

    return rows.map((r) => ({
      personCount: r.person_count !== null ? parseInt(r.person_count, 10) : null,
      sessions: parseInt(r.sessions, 10),
    }));
  }

  private async queryTrafficSource(eventToken: string) {
    const rows = await this.repo.manager.query<{
      source: string; opens: string; downloads: string;
    }[]>(`
      SELECT
        source,
        COUNT(*) AS opens,
        SUM(CASE WHEN action = 'download' THEN 1 ELSE 0 END) AS downloads
      FROM event_analytics
      WHERE event_token = $1
        AND source IS NOT NULL
      GROUP BY source
    `, [eventToken]);

    return rows.map((r) => ({
      source: r.source,
      opens: parseInt(r.opens, 10),
      downloads: parseInt(r.downloads, 10),
      conversionPct: parseInt(r.opens, 10)
        ? Math.round((parseInt(r.downloads, 10) / parseInt(r.opens, 10)) * 100)
        : 0,
    }));
  }

  private async querySessionsByHour(eventToken: string) {
    const rows = await this.repo.manager.query<{ hour: string; sessions: string }[]>(`
      SELECT DATE_TRUNC('hour', created_at) AS hour, COUNT(DISTINCT session_id) AS sessions
      FROM event_analytics
      WHERE event_token = $1
        AND action      = 'session_started'
      GROUP BY hour
      ORDER BY hour
    `, [eventToken]);

    return rows.map((r) => ({ hour: r.hour, sessions: parseInt(r.sessions, 10) }));
  }

  private async querySurfaceEngagement(eventToken: string) {
    const rows = await this.repo.manager.query<{
      surface: string; events: string; conversions: string;
    }[]>(`
      SELECT
        surface,
        COUNT(*) AS events,
        SUM(CASE WHEN action IN ('download', 'share_confirm_executed') THEN 1 ELSE 0 END) AS conversions
      FROM event_analytics
      WHERE event_token = $1
        AND surface IS NOT NULL
      GROUP BY surface
      ORDER BY conversions DESC
    `, [eventToken]);

    return rows.map((r) => ({
      surface: r.surface,
      events: parseInt(r.events, 10),
      conversions: parseInt(r.conversions, 10),
    }));
  }

  private async querySessionEngagement(eventToken: string) {
    const rows = await this.repo.manager.query<{
      session_id: string; photo_views: string; downloads: string; shares: string;
    }[]>(`
      SELECT
        session_id,
        COUNT(*) FILTER (WHERE action = 'photo_view')             AS photo_views,
        COUNT(*) FILTER (WHERE action = 'download')               AS downloads,
        COUNT(*) FILTER (WHERE action = 'share_confirm_executed') AS shares
      FROM event_analytics
      WHERE event_token = $1
        AND session_id IS NOT NULL
      GROUP BY session_id
    `, [eventToken]);

    return rows.map((r) => ({
      sessionId: r.session_id,
      photoViews: parseInt(r.photo_views, 10),
      downloads: parseInt(r.downloads, 10),
      shares: parseInt(r.shares, 10),
    }));
  }

  private async queryPostExpiration(eventToken: string) {
    const rows = await this.repo
      .createQueryBuilder('ea')
      .select('ea.action', 'action')
      .addSelect('COUNT(*)', 'count')
      .where('ea.event_token = :eventToken', { eventToken })
      .andWhere('ea.action IN (:...actions)', {
        actions: ['event_expired_view', 'imagina_cta_clicked', 'recover_photos_cta_clicked'],
      })
      .groupBy('ea.action')
      .getRawMany<{ action: string; count: string }>();

    return Object.fromEntries(rows.map((r) => [r.action, parseInt(r.count, 10)]));
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
      [AnalyticsSource.SESSION]: 0,
      total: 0,
    };
  }
}
