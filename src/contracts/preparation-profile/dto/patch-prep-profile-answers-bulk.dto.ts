import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, ValidateNested } from 'class-validator';

import { PatchPrepProfileAnswerDto } from './patch-prep-profile-answer.dto';

export class PatchPrepProfileAnswersBulkDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => PatchPrepProfileAnswerDto)
  answers!: PatchPrepProfileAnswerDto[];
}

