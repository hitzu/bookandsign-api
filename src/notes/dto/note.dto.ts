import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { Expose } from 'class-transformer';
import { NOTE_KIND } from '../types/note-kind.types';
import { NOTE_SCOPE } from '../types/note-scope.types';

export class NoteDto {
  @Expose()
  @IsNumber()
  id!: number;

  @Expose()
  @IsString()
  content!: string;

  @Expose()
  @IsEnum(NOTE_KIND)
  kind: NOTE_KIND = NOTE_KIND.INTERNAL;

  @Expose()
  @IsEnum(NOTE_SCOPE)
  scope!: NOTE_SCOPE;

  @Expose()
  @IsNumber()
  targetId!: number;

  @Expose()
  @IsNumber()
  @IsOptional()
  createdBy: number | null = null;
}
