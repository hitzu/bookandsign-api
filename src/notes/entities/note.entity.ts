import { Column, Entity, Index } from 'typeorm';

import { BaseTimeEntity } from '../../common/entities/base-time.entity';
import { UseDto } from '../../common/dto/use-dto.decorator';
import { NoteDto } from '../dto/note.dto';
import { NOTE_KIND } from '../types/note-kind.types';
import { NOTE_SCOPE } from '../types/note-scope.types';

@UseDto(NoteDto)
@Entity('notes')
@Index(['scope', 'targetId', 'createdAt'])
export class Note extends BaseTimeEntity {
  @Column('enum', { enum: NOTE_SCOPE })
  scope!: NOTE_SCOPE;

  @Column('integer', { name: 'target_id' })
  targetId!: number;

  @Column('enum', { enum: NOTE_KIND, default: NOTE_KIND.INTERNAL })
  kind: NOTE_KIND = NOTE_KIND.INTERNAL;

  @Column('text')
  content!: string;

  @Column('integer', { name: 'created_by', nullable: true })
  createdBy: number | null = null;
}
