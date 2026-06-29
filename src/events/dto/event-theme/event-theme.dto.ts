import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
import { EventThemeTokensDto } from './public-event-theme.dto';

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

  @Expose()
  @ApiPropertyOptional({
    type: EventThemeTokensDto,
    description: 'Resolved theme tokens',
    nullable: true,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => EventThemeTokensDto)
  tokens?: EventThemeTokensDto | null;
}
