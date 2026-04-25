import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsNumber, IsString } from 'class-validator';

export class EventThemeDto {
  @Expose()
  @ApiProperty({ type: Number, description: 'Phrase id' })
  @IsNumber()
  id!: number;

  @Expose()
  @ApiProperty({ type: String, description: 'key' })
  @IsString()
  key!: string;

  @Expose()
  @ApiProperty({ type: String, description: 'name' })
  @IsString()
  name!: string;
}