
import { Column, Entity, OneToMany } from 'typeorm';
import { BaseTimeEntity } from '../../common/entities/base-time.entity';
import type { EventThemeTokensDto } from '../dto/event-theme/public-event-theme.dto';
import { Event } from './event.entity';


@Entity('event_themes')
export class EventTheme extends BaseTimeEntity {
  @Column('text')
  key: string;

  @Column('text')
  name: string;

  @Column('jsonb', { nullable: true })
  tokens: EventThemeTokensDto | null;

  @OneToMany(() => Event, (event) => event.eventTheme)
  events?: Event[];
}
