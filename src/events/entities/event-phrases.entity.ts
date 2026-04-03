import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';

import { BaseTimeEntity } from '../../common/entities/base-time.entity';
import { EventType } from './event-type.entity';

@Entity('event_phrases')
export class EventPhrase extends BaseTimeEntity {
  @Column('integer', { name: 'event_type_id' })
  eventTypeId!: number;

  @Column('text')
  content!: string;

  @ManyToOne(() => EventType, (eventType) => eventType.phrases)
  @JoinColumn({ name: 'event_type_id' })
  eventType?: EventType;
}
