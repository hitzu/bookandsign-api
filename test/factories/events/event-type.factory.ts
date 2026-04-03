import { FactorizedAttrs, Factory } from "@jorgebodega/typeorm-factory";
import { EventType } from "../../../src/events/entities/event-type.entity";
import { faker } from '@faker-js/faker';
import { DataSource } from "typeorm";

export class EventTypeFactory extends Factory<EventType> {
  protected entity = EventType;
  protected dataSource: DataSource;

  constructor(dataSource: DataSource) {
    super();
    this.dataSource = dataSource;
  }

  protected attrs(): FactorizedAttrs<EventType> {
    return {
      name: faker.lorem.word(),
    };
  }
}