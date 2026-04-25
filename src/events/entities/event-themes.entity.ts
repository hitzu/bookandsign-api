
import { Column, Entity, OneToMany } from 'typeorm';
import { BaseTimeEntity } from '../../common/entities/base-time.entity';
import { Event } from './event.entity';


@Entity('event_themes')
export class EventTheme extends BaseTimeEntity {
  @Column('text')
  key: string;

  @Column('text')
  name: string;

  @OneToMany(() => Event, (event) => event.eventTheme)
  events?: Event[];
}