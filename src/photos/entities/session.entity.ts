import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';

import { Event } from '../../events/entities/event.entity';
import { BaseTimeEntity } from '../../common/entities/base-time.entity';

@Entity('sessions')
@Index('IDX_sessions_event_id', ['eventId'])
@Index('UQ_sessions_session_token', ['sessionToken'], { unique: true })
export class Session extends BaseTimeEntity {
  @Column('uuid', { name: 'session_token', unique: true })
  sessionToken!: string;

  @Column('integer', { name: 'event_id' })
  eventId!: number;

  @Column('varchar', { length: 20, default: 'active' })
  status!: 'active' | 'complete';

  @Column('integer', { name: 'photo_count', default: 0 })
  photoCount!: number;

  @Column('timestamptz', { name: 'completed_at', nullable: true })
  completedAt!: Date | null;

  @ManyToOne(() => Event, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'event_id' })
  event?: Event | null;
}
