import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { Repository } from 'typeorm';
import { EXCEPTION_RESPONSE } from '../config/errors/exception-response.config';
import { Slot } from '../slots/entities/slot.entity';
import { CreateNoteDto } from './dto/create-note.dto';
import { NoteResponseDto } from './dto/note-response.dto';
import { Note } from './entities/note.entity';
import { NOTE_SCOPE } from './types/note-scope.types';

@Injectable()
export class NotesService {
  private readonly logger = new Logger(NotesService.name);

  constructor(
    @InjectRepository(Note)
    private notesRepository: Repository<Note>,
    @InjectRepository(Slot)
    private slotsRepository: Repository<Slot>,
  ) {}

  private async ensureSlotExists(slotId: number): Promise<void> {
    const slot = await this.slotsRepository.findOne({ where: { id: slotId } });
    if (!slot) {
      throw new NotFoundException(EXCEPTION_RESPONSE.SLOT_NOT_FOUND);
    }
  }

  async findTimelineByTarget(
    scope: NOTE_SCOPE,
    targetId: number,
  ): Promise<NoteResponseDto[]> {
    if (scope === NOTE_SCOPE.SLOT) {
      await this.ensureSlotExists(targetId);
    }
    const notes = await this.notesRepository.find({
      where: { scope, targetId },
      order: { createdAt: 'ASC' },
    });
    return plainToInstance(NoteResponseDto, notes, {
      excludeExtraneousValues: true,
    });
  }

  async createForTarget(
    scope: NOTE_SCOPE,
    targetId: number,
    createNoteDto: CreateNoteDto,
    createdBy: number | null,
  ): Promise<NoteResponseDto> {
    if (scope === NOTE_SCOPE.SLOT) {
      await this.ensureSlotExists(targetId);
    }
    try {
      const noteToSave = this.notesRepository.create({
        scope,
        targetId,
        kind: createNoteDto.kind ?? undefined,
        content: createNoteDto.content,
        createdBy,
      });
      const saved = await this.notesRepository.save(noteToSave);
      return plainToInstance(NoteResponseDto, saved, {
        excludeExtraneousValues: true,
      });
    } catch (error) {
      this.logger.error(error, 'Error creating note');
      throw error;
    }
  }
}
