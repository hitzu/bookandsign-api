import type { FactorizedAttrs } from '@jorgebodega/typeorm-factory';
import { Factory } from '@jorgebodega/typeorm-factory';
import { faker } from '@faker-js/faker';
import { DataSource } from 'typeorm';
import { Slot } from '../../../src/slots/entities/slot.entity';
import { SLOT_PERIOD } from '../../../src/slots/types/slot-period.types';
import { SLOT_STATUS } from '../../../src/slots/types/slot-status.types';
import { UserFactory } from '../user/user.factory';

export class SlotFactory extends Factory<Slot> {
  protected entity = Slot;
  protected dataSource: DataSource;

  constructor(dataSource: DataSource) {
    super();
    this.dataSource = dataSource;
  }

  protected attrs(): FactorizedAttrs<Slot> {
    const date = faker.date.soon({ days: 30 });
    const yyyy = date.getUTCFullYear();
    const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(date.getUTCDate()).padStart(2, '0');
    return {
      eventDate: `${yyyy}-${mm}-${dd}`,
      period: faker.helpers.arrayElement<SLOT_PERIOD>(
        Object.values(SLOT_PERIOD),
      ),
      status: SLOT_STATUS.HELD,
      contractId: null,
      leadName: faker.person.fullName(),
      leadEmail: faker.internet.email(),
      leadPhone: faker.phone.number(),
    };
  }

  async create(attrs?: Partial<Slot>): Promise<Slot> {
    const slot = await this.make(attrs);
    if (slot.authorId == null) {
      const userFactory = new UserFactory(this.dataSource);
      const user = await userFactory.create();
      slot.authorId = user.id;
    }
    return this.dataSource.getRepository(Slot).save(slot);
  }
}
