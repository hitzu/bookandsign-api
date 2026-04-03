import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsNumber, IsString } from 'class-validator';

export class PhraseByEventTokenDto {
  @Expose()
  @ApiProperty({ type: Number, description: 'Phrase id' })
  @IsNumber()
  id!: number;

  @Expose()
  @ApiProperty({ type: String, description: 'Phrase content' })
  @IsString()
  content!: string;
}