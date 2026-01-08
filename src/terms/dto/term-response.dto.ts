import { Expose } from 'class-transformer';
import { IsEnum, IsNumber, IsString } from 'class-validator';

import { TERM_SCOPE } from '../types/term-scope.types';

export class TermResponseDto {
  @Expose()
  @IsNumber()
  id!: number;

  @Expose()
  @IsString()
  code!: string;

  @Expose()
  @IsString()
  title!: string;

  @Expose()
  @IsString()
  content!: string;

  @Expose()
  @IsEnum(TERM_SCOPE)
  scope!: TERM_SCOPE;
}
