import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppDataSource as TestDataSource } from '../config/database/data-source';
import { EXCEPTION_RESPONSE } from '../config/errors/exception-response.config';
import { Slot } from '../slots/entities/slot.entity';
import { SlotFactory } from '../../test/factories/slots/slot.factory';
import { CreateNoteDto } from './dto/create-note.dto';
import { Note } from './entities/note.entity';
import { NotesService } from './notes.service';
import { NOTE_SCOPE } from './types/note-scope.types';

describe('NotesService', () => {
  let service: NotesService;
  let notesRepository: Repository<Note>;
  let slotFactory: SlotFactory;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotesService,
        {
          provide: getRepositoryToken(Note),
          useValue: TestDataSource.getRepository(Note),
        },
        {
          provide: getRepositoryToken(Slot),
          useValue: TestDataSource.getRepository(Slot),
        },
      ],
    }).compile();

    service = module.get<NotesService>(NotesService);
    notesRepository = module.get<Repository<Note>>(getRepositoryToken(Note));
    slotFactory = new SlotFactory(TestDataSource);
  });

  describe('createForTarget', () => {
    it('should throw NotFoundException when slot does not exist', async () => {
      const dto: CreateNoteDto = { content: 'Hello' };
      await expect(
        service.createForTarget(NOTE_SCOPE.SLOT, 999999, dto, null),
      ).rejects.toEqual(new NotFoundException(EXCEPTION_RESPONSE.SLOT_NOT_FOUND));
    });

    it('should create a slot note with createdBy', async () => {
      const slot = await slotFactory.create();
      const dto: CreateNoteDto = { content: 'Se envió PDF de paquetes' };
      const result = await service.createForTarget(
        NOTE_SCOPE.SLOT,
        slot.id,
        dto,
        23,
      );
      expect(result.id).toBeDefined();
      expect(result.createdBy).toBe(23);
      expect(result.content).toBe(dto.content);
    });

    it('should create a contract note without validating contract existence', async () => {
      const dto: CreateNoteDto = { content: 'Contract note' };
      const result = await service.createForTarget(
        NOTE_SCOPE.CONTRACT,
        123,
        dto,
        null,
      );
      expect(result.id).toBeDefined();
      expect(result.scope).toBe(NOTE_SCOPE.CONTRACT);
      expect(result.targetId).toBe(123);
    });
  });

  describe('findTimelineByTarget', () => {
    it('should return notes ordered by createdAt asc', async () => {
      const slot = await slotFactory.create();
      await service.createForTarget(NOTE_SCOPE.SLOT, slot.id, { content: 'First' }, null);
      await service.createForTarget(NOTE_SCOPE.SLOT, slot.id, { content: 'Second' }, null);
      const notes = await service.findTimelineByTarget(NOTE_SCOPE.SLOT, slot.id);
      expect(notes).toHaveLength(2);
      expect(notes[0]?.content).toBe('First');
      expect(notes[1]?.content).toBe('Second');
    });

    it('should return empty array when target has no notes', async () => {
      const slot = await slotFactory.create();
      const notes = await service.findTimelineByTarget(NOTE_SCOPE.SLOT, slot.id);
      expect(notes).toEqual([]);
    });

    it('should throw NotFoundException when slot does not exist', async () => {
      await expect(
        service.findTimelineByTarget(NOTE_SCOPE.SLOT, 999999),
      ).rejects.toEqual(new NotFoundException(EXCEPTION_RESPONSE.SLOT_NOT_FOUND));
    });

    it('should persist notes in repository', async () => {
      const slot = await slotFactory.create();
      await service.createForTarget(NOTE_SCOPE.SLOT, slot.id, { content: 'Hello' }, null);
      const persisted = await notesRepository.find({
        where: { scope: NOTE_SCOPE.SLOT, targetId: slot.id },
      });
      expect(persisted).toHaveLength(1);
      expect(persisted[0]?.content).toBe('Hello');
    });
  });
});


