import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';

import { BaseTimeEntity } from '../../common/entities/base-time.entity';
import { UseDto } from '../../common/dto/use-dto.decorator';
import { Event } from '../../events/entities/event.entity';
import { PhotoResponseDto } from '../dto/photo-response.dto';

@Entity('photos')
@UseDto(PhotoResponseDto)
@Index('IDX_photos_event_id', ['eventId'])
@Index('UQ_photos_event_storage', ['eventId', 'storagePath'], { unique: true })
export class Photo extends BaseTimeEntity {
  @Column('varchar', { name: 'storage_path', length: 512 })
  storagePath!: string;

  @Column('varchar', { name: 'public_url', length: 1024 })
  publicUrl!: string;

  @Column('timestamptz', { name: 'consent_at' })
  consentAt!: Date;

  @Column('integer', { name: 'event_id' })
  eventId!: number;

  @ManyToOne(() => Event)
  @JoinColumn({ name: 'event_id' })
  event?: Event | null;
}
