import { IsNotEmpty, IsString } from 'class-validator';

export class CreatePrepProfileUploadUrlDto {
  @IsString()
  @IsNotEmpty()
  questionId!: string;

  @IsString()
  @IsNotEmpty()
  fileName!: string;

  @IsString()
  @IsNotEmpty()
  mime!: string;
}

