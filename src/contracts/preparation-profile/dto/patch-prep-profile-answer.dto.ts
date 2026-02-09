import { IsDefined, IsNotEmpty, IsString } from 'class-validator';

export class PatchPrepProfileAnswerDto {
  @IsString()
  @IsNotEmpty()
  questionId!: string;

  @IsDefined()
  value!: unknown;
}

