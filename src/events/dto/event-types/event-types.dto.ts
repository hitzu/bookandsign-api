import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import {
  IsNumber,
  IsString,
} from 'class-validator';


export class EventTypeDto {
  @ApiProperty(
    { type: Number, description: 'Event type id' }
  )
  @Expose()
  @ApiProperty({ type: Number, description: 'Event type id' })
  @IsNumber()
  id!: number;

  @ApiProperty(
    { type: String, description: 'Event name' }
  )
  @Expose()
  @ApiProperty({ type: String, description: 'Event name' })
  @IsString()
  name!: string;
}
