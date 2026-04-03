import { Column, Entity, OneToMany } from 'typeorm';

import { BaseTimeEntity } from '../../common/entities/base-time.entity';
import { EventPhrase } from './event-phrases.entity';
import { Event } from './event.entity';

@Entity('event_types')
export class EventType extends BaseTimeEntity {
  @Column('varchar', { length: 255, unique: true })
  name!: string;

  @OneToMany(() => Event, (event) => event.eventType)
  events?: Event[];

  @OneToMany(() => EventPhrase, (phrase) => phrase.eventType)
  phrases?: EventPhrase[];
}
