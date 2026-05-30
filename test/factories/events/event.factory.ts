import type { FactorizedAttrs } from '@jorgebodega/typeorm-factory';
import { Factory } from '@jorgebodega/typeorm-factory';
import { faker } from '@faker-js/faker';
import type { DataSource } from 'typeorm';

import { Event } from '../../../src/events/entities/event.entity';
import { EventType } from '../../../src/events/entities/event-type.entity';
import { ServiceType } from '../../../src/events/entities/service-type.entity';
import { ContractFactory } from '../contracts/contract.factory';

export class EventFactory extends Factory<Event> {
  protected entity = Event;
  protected dataSource: DataSource;

  constructor(dataSource: DataSource) {
    super();
    this.dataSource = dataSource;
  }

  protected attrs(): FactorizedAttrs<Event> {
    const serviceStartsAt = faker.date.soon({ days: 30 });
    const serviceEndsAt = new Date(
      serviceStartsAt.getTime() +
      faker.number.int({ min: 2, max: 8 }) * 60 * 60 * 1000,
    );

    return {
      key: `event-${faker.string.alphanumeric(12)}`,
      token: faker.string.uuid(),
      contractId: 0,
      eventTypeId: null,
      serviceTypeId: null,
      honoreesNames: `${faker.person.firstName()} y ${faker.person.firstName()}`,
      albumPhrase: faker.lorem.sentence(),
      venueName: `${faker.company.name()} — salón`,
      serviceLocationUrl: faker.internet.url(),
      serviceStartsAt,
      serviceEndsAt,
      delegateName: faker.person.fullName(),
      printTemplates: null,
    };
  }

  async create(attrs?: Partial<Event>): Promise<Event> {
    const event = await this.make({ ...attrs });
    if (event.contractId === 0) {
      const contractFactory = new ContractFactory(this.dataSource);
      const contract = await contractFactory.create();
      event.contractId = contract.id;
    }
    return this.dataSource.getRepository(Event).save(event);
  }

  async createForEventType(eventType: EventType): Promise<Event> {
    const event = await this.make({ eventTypeId: eventType.id });
    return this.dataSource.getRepository(Event).save(event);
  }

  async createForServiceType(serviceType: ServiceType): Promise<Event> {
    const event = await this.make({ serviceTypeId: serviceType.id });
    return this.dataSource.getRepository(Event).save(event);
  }
}
