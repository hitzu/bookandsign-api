import { FactorizedAttrs, Factory } from "@jorgebodega/typeorm-factory";
import { DataSource } from "typeorm";
import { EventPhrase } from "src/events/entities/event-phrases.entity";
import { EventTypeFactory } from './event-type.factory';
import { faker } from "@faker-js/faker";

export class EventPhraseFactory extends Factory<EventPhrase> {
  protected entity = EventPhrase;
  protected dataSource: DataSource;

  constructor(dataSource: DataSource) {
    super();
    this.dataSource = dataSource;
  }

  protected attrs(): FactorizedAttrs<EventPhrase> {
    return {
      content: faker.lorem.sentence()
    }
  }

  async create(attrs?: Partial<EventPhrase>): Promise<EventPhrase> {
    const eventPhrase = await this.make({ ...attrs })
    const eventTypeFactory = new EventTypeFactory(this.dataSource);
    const eventType = await eventTypeFactory.create();
    eventPhrase.eventTypeId = eventType.id;

    return this.dataSource.getRepository(EventPhrase).save(eventPhrase)
  }
}