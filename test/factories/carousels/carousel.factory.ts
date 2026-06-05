import type { FactorizedAttrs } from '@jorgebodega/typeorm-factory';
import { Factory } from '@jorgebodega/typeorm-factory';
import { faker } from '@faker-js/faker';
import type { DataSource } from 'typeorm';

import { Carousel } from '../../../src/carousels/entities/carousel.entity';

export class CarouselFactory extends Factory<Carousel> {
  protected entity = Carousel;
  protected dataSource: DataSource;

  constructor(dataSource: DataSource) {
    super();
    this.dataSource = dataSource;
  }

  protected attrs(): FactorizedAttrs<Carousel> {
    return {
      page: 'main-page',
      section: 'general',
      brandId: null,
      contentType: 'image',
      imageUrl: faker.image.url(),
      title: faker.lorem.words(3),
      subtitle: null,
      description: null,
      ctaLabel: null,
      ctaUrl: null,
      metadata: {},
      sortOrder: 0,
      status: 'active',
    };
  }

  async create(attrs?: Partial<Carousel>): Promise<Carousel> {
    const entity = await this.make({ ...attrs });
    return this.dataSource.getRepository(Carousel).save(entity);
  }
}
