import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, IsString, ValidateNested } from 'class-validator';

import { EventThemeTokensDto } from './public-event-theme.dto';

export class CreateEventThemeDto {
  @ApiProperty({ example: 'amor-eterno' })
  @IsString()
  key!: string;

  @ApiProperty({ example: 'Amor Eterno' })
  @IsString()
  name!: string;

  @ApiPropertyOptional({ type: EventThemeTokensDto, nullable: true })
  @IsOptional()
  @ValidateNested()
  @Type(() => EventThemeTokensDto)
  tokens?: EventThemeTokensDto | null;
}
