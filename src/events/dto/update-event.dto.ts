import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsOptional, IsString, IsUrl, IsNumber } from 'class-validator';


export class UpdateEventDto {
  @ApiPropertyOptional({ type: String, description: 'Event name' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ type: String, description: 'Event description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    type: Number,
    description: 'Event type id',
  })
  @IsNumber()
  @IsOptional()
  eventTypeId?: number;

  @ApiPropertyOptional({
    type: String,
    description: 'Nombre de los festejados',
  })
  @IsString()
  @IsOptional()
  honoreesNames?: string;

  @ApiPropertyOptional({
    type: String,
    description: 'Frase para el álbum',
  })
  @IsString()
  @IsOptional()
  albumPhrase?: string;

  @ApiPropertyOptional({
    type: String,
    description: 'Nombre del salón',
  })
  @IsString()
  @IsOptional()
  venueName?: string;

  @ApiPropertyOptional({
    type: String,
    description: 'Link de ubicación para el servicio',
  })
  @IsUrl({ require_protocol: true })
  @IsOptional()
  serviceLocationUrl?: string;

  @ApiPropertyOptional({
    type: String,
    format: 'date-time',
    description: 'Hora de inicio del servicio (ISO 8601)',
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  serviceStartsAt?: Date;

  @ApiPropertyOptional({
    type: String,
    format: 'date-time',
    description: 'Hora de fin del servicio (ISO 8601)',
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  serviceEndsAt?: Date;

  @ApiPropertyOptional({
    type: String,
    description: 'Persona delegada',
  })
  @IsString()
  @IsOptional()
  delegateName?: string;
}
