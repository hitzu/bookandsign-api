import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateEventDto {
  @ApiProperty({ type: Number, description: 'Contract id' })
  @IsNumber()
  contractId!: number;

  @ApiProperty({ type: String, description: 'Event name' })
  @IsString()
  name!: string;

  @ApiProperty({ type: String, description: 'Internal key (unique)' })
  @IsString()
  key!: string;

  @ApiPropertyOptional({ type: String, description: 'Event description' })
  @IsString()
  @IsOptional()
  description?: string;
}
