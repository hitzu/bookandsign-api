import { IsNotEmpty, IsString } from 'class-validator';

export class UnlockPrepProfileQuestionDto {
  @IsString()
  @IsNotEmpty()
  questionId!: string;

  @IsString()
  @IsNotEmpty()
  reason!: string;
}

