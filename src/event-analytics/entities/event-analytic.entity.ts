import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { Event } from '../../events/entities/event.entity';
import { BaseTimeEntity } from '../../common/entities/base-time.entity';
import { AnalyticsSource } from '../enums/analytics-source.enum';

@Entity('event_analytics')
@Index('idx_ea_event_action_source', ['eventToken', 'action', 'source'])
export class EventAnalytic extends BaseTimeEntity {
  @Column({ name: 'event_token', type: 'uuid' })
  eventToken: string;

  @ManyToOne(() => Event, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'event_token', referencedColumnName: 'token' })
  event: Event;

  @Column({ name: 'session_id', type: 'uuid', nullable: true })
  sessionId: string | null;

  @Column({ length: 64 })
  action: string;

  @Column({ type: 'varchar', length: 32, nullable: true })
  source: AnalyticsSource | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown> | null;

  @Column({ name: 'user_agent', type: 'text', nullable: true })
  userAgent: string | null;
}
