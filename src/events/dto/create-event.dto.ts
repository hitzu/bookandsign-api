import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsDate,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { PrintTemplateItemDto } from './print-template-item.dto';

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

  @ApiProperty({ type: Number, description: 'Event type id' })
  @IsNumber()
  eventTypeId!: number;

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

  @ApiPropertyOptional({
    type: Number,
    description: 'Número de fotos por sesión (1-10, default 2)',
    default: 2,
  })
  @IsInt()
  @Min(1)
  @Max(10)
  @IsOptional()
  photoCount?: number = 2;

  @ApiProperty({ type: Number, description: 'Event type id' })
  @IsOptional()
  @IsNumber()
  eventThemeId?: number;

  @ApiPropertyOptional({
    type: String,
    enum: ['photobooth', 'red_carpet'],
    description: 'Service type — routes printer and print flow in the Swift client',
    nullable: true,
  })
  @IsString()
  @IsOptional()
  serviceType?: string | null;

  @ApiPropertyOptional({
    type: [PrintTemplateItemDto],
    description: 'Ordered array of subproducts to print. Order = print order.',
    nullable: true,
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PrintTemplateItemDto)
  @IsOptional()
  printTemplates?: PrintTemplateItemDto[] | null;

  @ApiPropertyOptional({
    type: String,
    description: '[Deprecated] Single print template string. Kept for transition period.',
  })
  @IsString()
  @IsOptional()
  printTemplate?: string;
}
