import { FactorizedAttrs, Factory } from '@jorgebodega/typeorm-factory';
import { faker } from '@faker-js/faker';
import { DataSource } from 'typeorm';
import { ServiceType } from '../../../src/events/entities/service-type.entity';

export class ServiceTypeFactory extends Factory<ServiceType> {
  protected entity = ServiceType;
  protected dataSource: DataSource;

  constructor(dataSource: DataSource) {
    super();
    this.dataSource = dataSource;
  }

  protected attrs(): FactorizedAttrs<ServiceType> {
    return {
      name: faker.lorem.word(),
    };
  }
}
