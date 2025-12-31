import { Expose, Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsNumber,
  IsString,
  ValidateNested,
} from 'class-validator';
import { TERM_SCOPE } from '../types/term-scope.types';
import { PackageTermDto } from './packageTerm.dto';

export class TermDto {
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

  @Expose()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PackageTermDto)
  packageTerms!: PackageTermDto[];
}
