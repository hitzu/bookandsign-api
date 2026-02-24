import type { FactorizedAttrs } from '@jorgebodega/typeorm-factory';
import { Factory } from '@jorgebodega/typeorm-factory';
import { faker } from '@faker-js/faker';
import type { DataSource } from 'typeorm';

import { Event } from '../../../src/events/entities/event.entity';
import { ContractFactory } from '../contracts/contract.factory';

export class EventFactory extends Factory<Event> {
  protected entity = Event;
  protected dataSource: DataSource;

  constructor(dataSource: DataSource) {
    super();
    this.dataSource = dataSource;
  }

  protected attrs(): FactorizedAttrs<Event> {
    return {
      name: faker.lorem.words(3),
      key: `event-${faker.string.alphanumeric(12)}`,
      description: faker.lorem.sentence(),
      token: faker.string.uuid(),
      contractId: 0,
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
}
