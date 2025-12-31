import { IsEnum, IsOptional, IsString } from 'class-validator';
import { TERM_SCOPE } from '../types/term-scope.types';

export class FindAllTermsQueryDto {
  @IsEnum(TERM_SCOPE)
  @IsOptional()
  scope?: TERM_SCOPE;

  @IsString()
  @IsOptional()
  q?: string;
}
