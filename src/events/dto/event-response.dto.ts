import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { IsDate, IsNumber, IsOptional, IsString } from 'class-validator';
import { EventThemeDto } from './event-theme/event-theme.dto';


export class EventResponseDto {
  @Expose()
  @ApiProperty()
  @IsNumber()
  id!: number;

  @Expose()
  @ApiProperty()
  @IsString()
  name!: string;

  @Expose()
  @ApiProperty()
  @IsString()
  key!: string;

  @Expose()
  @ApiPropertyOptional({ nullable: true })
  @IsString()
  @IsOptional()
  description?: string | null;

  @Expose()
  @ApiProperty()
  @IsString()
  token!: string;

  @Expose()
  @ApiProperty()
  @IsNumber()
  contractId!: number;

  @Expose()
  @ApiPropertyOptional({
    type: Number,
    description: 'Event type id',
    nullable: true,
  })
  @IsNumber()
  @IsOptional()
  eventTypeId?: number | null;

  @Expose()
  @ApiPropertyOptional({ nullable: true })
  @IsString()
  @IsOptional()
  honoreesNames?: string | null;

  @Expose()
  @ApiPropertyOptional({ nullable: true })
  @IsString()
  @IsOptional()
  albumPhrase?: string | null;

  @Expose()
  @ApiPropertyOptional({ nullable: true })
  @IsString()
  @IsOptional()
  venueName?: string | null;

  @Expose()
  @ApiPropertyOptional({ nullable: true })
  @IsString()
  @IsOptional()
  serviceLocationUrl?: string | null;

  @Expose()
  @ApiPropertyOptional({ nullable: true })
  @IsDate()
  @IsOptional()
  serviceStartsAt?: Date | null;

  @Expose()
  @ApiPropertyOptional({ nullable: true })
  @IsDate()
  @IsOptional()
  serviceEndsAt?: Date | null;

  @Expose()
  @ApiPropertyOptional({ nullable: true })
  @IsString()
  @IsOptional()
  delegateName?: string | null;

  @Expose()
  @ApiProperty({ type: Number, description: 'Fotos por sesión', default: 2 })
  @IsNumber()
  photoCount!: number;

  @Expose()
  @ApiPropertyOptional({
    type: Number,
    description: 'Event theme id',
    nullable: true,
  })
  @IsNumber()
  @IsOptional()
  eventThemeId?: number | null;

  @Expose()
  @ApiProperty()
  createdAt!: Date;

  @Expose()
  @ApiProperty()
  updatedAt!: Date;

  @Expose()
  @ApiProperty()
  @Type(() => EventThemeDto)
  eventTheme: EventThemeDto
}
