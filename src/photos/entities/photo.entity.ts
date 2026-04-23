import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';

import { BaseTimeEntity } from '../../common/entities/base-time.entity';
import { UseDto } from '../../common/dto/use-dto.decorator';
import { Event } from '../../events/entities/event.entity';
import { PhotoResponseDto } from '../dto/photo-response.dto';
import { Session } from './session.entity';
import { PhotoStatus } from '../enums/index';

@Entity('photos')
@UseDto(PhotoResponseDto)
@Index('IDX_photos_event_id', ['eventId'])
@Index('IDX_photos_session_id', ['sessionId'])
@Index('UQ_photos_event_storage', ['eventId', 'storagePath'], { unique: true })
export class Photo extends BaseTimeEntity {
  @Column('varchar', { name: 'storage_path', length: 512 })
  storagePath!: string;

  @Column('varchar', { name: 'public_url', length: 1024, nullable: true })
  publicUrl!: string | null;

  @Column('timestamptz', { name: 'consent_at' })
  consentAt!: Date;

  @Column('integer', { name: 'event_id' })
  eventId!: number;

  @Column('integer', { name: 'session_id', nullable: true })
  sessionId!: number | null;

  @Column('enum', {
    name: 'status',
    enum: PhotoStatus,
    default: PhotoStatus.READY,
  })
  status!: PhotoStatus;

  @ManyToOne(() => Event)
  @JoinColumn({ name: 'event_id' })
  event?: Event | null;

  @ManyToOne(() => Session)
  @JoinColumn({ name: 'session_id' })
  session?: Session | null;
}
