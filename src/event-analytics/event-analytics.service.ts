import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventAnalytic } from './entities/event-analytic.entity';
import { TrackActionDto } from './dto/track-action.dto';

type AnalyticsSummaryRow = {
  action: string;
  count: string;
};

@Injectable()
export class EventAnalyticsService {
  constructor(
    @InjectRepository(EventAnalytic)
    private readonly repo: Repository<EventAnalytic>,
  ) {}

  async track(dto: TrackActionDto, userAgent: string): Promise<void> {
    await this.repo.save({
      eventToken: dto.eventToken,
      sessionId: dto.sessionId ?? null,
      action: dto.action,
      metadata: dto.metadata ?? null,
      userAgent: userAgent ?? null,
    });
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
}
