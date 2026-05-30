import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsDate, IsInt, IsNumber, IsOptional, IsString, IsUrl, Max, Min, ValidateNested } from 'class-validator';
import { PrintTemplateItemDto } from './print-template-item.dto';

export class UpdateEventDto {
  @ApiPropertyOptional({
    type: Number,
    description: 'Event type id',
  })
  @IsNumber()
  @IsOptional()
  eventTypeId?: number;

  @ApiPropertyOptional({
    type: Number,
    description: 'Service type id',
    nullable: true,
  })
  @IsNumber()
  @IsOptional()
  serviceTypeId?: number | null;

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
    description: 'Número de fotos por sesión (1-10)',
  })
  @IsInt()
  @Min(1)
  @Max(10)
  @IsOptional()
  photoCount?: number;

  @ApiPropertyOptional({
    type: String,
    description: 'Plantilla de impresión (polaroid_2 | keychain_2)',
  })
  @IsString()
  @IsOptional()
  printTemplate?: string;

  @ApiPropertyOptional({
    type: String,
    description: 'Ícono decorativo (rings | balloon | graduation | baby | xv | null)',
    nullable: true,
  })
  @IsString()
  @IsOptional()
  decorativeIcon?: string | null;

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
}
