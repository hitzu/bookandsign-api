import { IsNotEmpty, IsString } from 'class-validator';

export class PrepProfileOwnerQueryDto {
  @IsString()
  @IsNotEmpty()
  phone!: string;
}

