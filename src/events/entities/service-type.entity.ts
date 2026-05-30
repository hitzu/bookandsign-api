import { Column, Entity, OneToMany } from 'typeorm';

import { BaseTimeEntity } from '../../common/entities/base-time.entity';
import { Event } from './event.entity';

@Entity('event_service_types')
export class ServiceType extends BaseTimeEntity {
  @Column('varchar', { length: 255, unique: true })
  name!: string;

  @OneToMany(() => Event, (event) => event.serviceType)
  events?: Event[];
}
