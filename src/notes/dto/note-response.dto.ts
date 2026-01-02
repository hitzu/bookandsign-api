import { Expose } from 'class-transformer';
import { IsDate, IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { NOTE_KIND } from '../types/note-kind.types';
import { NOTE_SCOPE } from '../types/note-scope.types';

export class NoteResponseDto {
  @Expose()
  @IsNumber()
  id!: number;

  @Expose()
  @IsDate()
  createdAt!: Date;

  @Expose()
  @IsEnum(NOTE_SCOPE)
  scope!: NOTE_SCOPE;

  @Expose()
  @IsNumber()
  targetId!: number;

  @Expose()
  @IsEnum(NOTE_KIND)
  kind!: NOTE_KIND;

  @Expose()
  @IsString()
  content!: string;

  @Expose()
  @IsOptional()
  @IsNumber()
  createdBy!: number | null;
}


