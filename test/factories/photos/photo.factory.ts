import type { FactorizedAttrs } from '@jorgebodega/typeorm-factory';
import { Factory } from '@jorgebodega/typeorm-factory';
import { faker } from '@faker-js/faker';
import type { DataSource } from 'typeorm';

import { Photo } from '../../../src/photos/entities/photo.entity';
import { EventFactory } from '../events/event.factory';

export class PhotoFactory extends Factory<Photo> {
  protected entity = Photo;
  protected dataSource: DataSource;

  constructor(dataSource: DataSource) {
    super();
    this.dataSource = dataSource;
  }

  protected attrs(): FactorizedAttrs<Photo> {
    return {
      storagePath: `event_1/photo_${faker.string.alphanumeric(16)}.jpg`,
      publicUrl: faker.internet.url(),
      consentAt: new Date(),
      eventId: 0,
    };
  }

  async create(attrs?: Partial<Photo>): Promise<Photo> {
    const photo = await this.make({ ...attrs });
    if (photo.eventId === 0) {
      const eventFactory = new EventFactory(this.dataSource);
      const event = await eventFactory.create();
      photo.eventId = event.id;
    }
    return this.dataSource.getRepository(Photo).save(photo);
  }
}
