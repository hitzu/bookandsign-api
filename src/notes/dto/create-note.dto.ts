import { IsEnum, IsOptional, IsString } from 'class-validator';
import { NOTE_KIND } from '../types/note-kind.types';

export class CreateNoteDto {
  @IsString()
  content!: string;

  @IsEnum(NOTE_KIND)
  @IsOptional()
  kind?: NOTE_KIND = NOTE_KIND.INTERNAL;
}
