import type { FactorizedAttrs } from '@jorgebodega/typeorm-factory';
import { Factory } from '@jorgebodega/typeorm-factory';
import { faker } from '@faker-js/faker';
import { DataSource } from 'typeorm';
import { Note } from '../../../src/notes/entities/note.entity';
import { NOTE_KIND } from '../../../src/notes/types/note-kind.types';
import { NOTE_SCOPE } from '../../../src/notes/types/note-scope.types';

export class NoteFactory extends Factory<Note> {
  protected entity = Note;
  protected dataSource: DataSource;

  constructor(dataSource: DataSource) {
    super();
    this.dataSource = dataSource;
  }

  protected attrs(): FactorizedAttrs<Note> {
    return {
      scope: NOTE_SCOPE.SLOT,
      targetId: 0,
      kind: NOTE_KIND.INTERNAL,
      content: faker.lorem.sentence(),
      createdBy: null,
    };
  }

  async createForTarget(
    scope: NOTE_SCOPE,
    targetId: number,
    attrs?: Partial<Note>,
  ): Promise<Note> {
    const note = await this.make({
      scope,
      targetId,
      ...attrs,
    });
    return this.dataSource.getRepository(Note).save(note);
  }
}


