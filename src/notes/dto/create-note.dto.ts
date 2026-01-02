import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { NOTE_KIND } from '../types/note-kind.types';
import { NOTE_SCOPE } from '../types/note-scope.types';

export class CreateNoteDto {
  @ApiProperty({ type: String, required: true })
  @IsString()
  content!: string;

  @ApiPropertyOptional({
    type: String,
    enum: NOTE_KIND,
    default: NOTE_KIND.INTERNAL,
    required: false,
  })
  @IsEnum(NOTE_KIND)
  @IsOptional()
  kind: NOTE_KIND = NOTE_KIND.INTERNAL;

  @ApiProperty({ type: Number, required: true })
  @IsNumber()
  targetId!: number;

  @ApiProperty({ type: String, enum: NOTE_SCOPE, required: true })
  @IsEnum(NOTE_SCOPE)
  scope!: NOTE_SCOPE;
}
