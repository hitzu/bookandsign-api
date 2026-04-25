import { Column, Entity, Index, JoinColumn, ManyToOne, OneToOne } from 'typeorm';

import { BaseTimeEntity } from '../../common/entities/base-time.entity';
import { UseDto } from '../../common/dto/use-dto.decorator';
import { Contract } from '../../contracts/entities/contract.entity';
import { EventResponseDto } from '../dto/event-response.dto';
import { EventType } from './event-type.entity';
import { EventTheme } from './event-themes.entity';

@Entity('events')
@UseDto(EventResponseDto)
@Index('UQ_events_token', ['token'], { unique: true })
@Index('UQ_events_key', ['key'], { unique: true })
export class Event extends BaseTimeEntity {
  @Column('varchar', { length: 255 })
  name!: string;

  @Column('varchar', { length: 255, unique: true })
  key!: string;

  @Column('text', { nullable: true })
  description!: string | null;

  @Column('uuid', { unique: true })
  token!: string;

  @Column('integer', { name: 'contract_id' })
  contractId!: number;

  @Column('number', { name: 'event_type_id', nullable: true })
  eventTypeId!: number | null;

  @Column('text', { name: 'honorees_names', nullable: true })
  honoreesNames!: string | null;

  @Column('text', { name: 'album_phrase', nullable: true })
  albumPhrase!: string | null;

  @Column('varchar', { name: 'venue_name', length: 255, nullable: true })
  venueName!: string | null;

  @Column('text', { name: 'service_location_url', nullable: true })
  serviceLocationUrl!: string | null;

  @Column('timestamptz', { name: 'service_starts_at', nullable: true })
  serviceStartsAt!: Date | null;

  @Column('timestamptz', { name: 'service_ends_at', nullable: true })
  serviceEndsAt!: Date | null;

  @Column('varchar', { name: 'delegate_name', length: 255, nullable: true })
  delegateName!: string | null;

  @Column('integer', { name: 'photo_count', default: 2 })
  photoCount!: number;

  @Column('number', { name: 'event_theme_id', nullable: true })
  eventThemeId!: number | null;

  @ManyToOne(() => EventType, (eventType) => eventType.events)
  @JoinColumn({ name: 'event_type_id' })
  eventType?: EventType | null;

  @OneToOne(() => Contract, (contract) => contract.event, { nullable: true })
  @JoinColumn({ name: 'contract_id' })
  contract?: Contract | null;

  @ManyToOne(() => EventTheme, (eventTheme) => eventTheme.events)
  @JoinColumn({ name: 'event_theme_id' })
  eventTheme?: EventTheme | null;
}
