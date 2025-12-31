import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { TERM_SCOPE } from '../types/term-scope.types';

export class CreateTermDto {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString()
  @IsNotEmpty()
  content!: string;

  @IsEnum(TERM_SCOPE)
  scope!: TERM_SCOPE;
}
