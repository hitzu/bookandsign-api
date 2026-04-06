import type { FactorizedAttrs } from '@jorgebodega/typeorm-factory';
import { Factory } from '@jorgebodega/typeorm-factory';
import { faker } from '@faker-js/faker';
import type { DataSource } from 'typeorm';

import { EventAnalytic } from '../../../src/event-analytics/entities/event-analytic.entity';
import { EventFactory } from '../events/event.factory';
import { AnalyticsAction } from '../../../src/event-analytics/enums/analytics-action.enum';

export class EventAnalyticFactory extends Factory<EventAnalytic> {
  protected entity = EventAnalytic;
  protected dataSource: DataSource;

  constructor(dataSource: DataSource) {
    super();
    this.dataSource = dataSource;
  }

  protected attrs(): FactorizedAttrs<EventAnalytic> {
    return {
      eventToken: faker.string.uuid(),
      sessionId: faker.string.uuid(),
      action: faker.helpers.arrayElement(Object.values(AnalyticsAction)),
      metadata: null,
      userAgent: faker.internet.userAgent(),
    };
  }

  async create(attrs?: Partial<EventAnalytic>): Promise<EventAnalytic> {
    const analytic = await this.make({ ...attrs });

    if (!attrs?.eventToken) {
      const eventFactory = new EventFactory(this.dataSource);
      const event = await eventFactory.create();
      analytic.eventToken = event.token;
    }

    return this.dataSource.getRepository(EventAnalytic).save(analytic);
  }

  async createForEvent(eventToken: string, action?: AnalyticsAction): Promise<EventAnalytic> {
    const analytic = await this.make({
      eventToken,
      action: action ?? faker.helpers.arrayElement(Object.values(AnalyticsAction)),
    });
    return this.dataSource.getRepository(EventAnalytic).save(analytic);
  }
}
