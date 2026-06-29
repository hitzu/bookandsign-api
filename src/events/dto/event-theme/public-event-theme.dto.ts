import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsOptional, IsString } from 'class-validator';

export class EventThemeTokensDto {
  @Expose()
  @ApiProperty({ example: '#fff5f7' })
  @IsString()
  background!: string;

  @Expose()
  @ApiProperty({ example: '#ec4899' })
  @IsString()
  primary!: string;

  @Expose()
  @ApiProperty({ example: '#ffffff' })
  @IsString()
  onPrimary!: string;

  @Expose()
  @ApiProperty({ example: '#a855f7' })
  @IsString()
  secondary!: string;

  @Expose()
  @ApiProperty({ example: '#831843' })
  @IsString()
  text!: string;

  @Expose()
  @ApiProperty({ example: '#9ca3af' })
  @IsString()
  textMuted!: string;

  @Expose()
  @ApiProperty({ example: '#fce7f3' })
  @IsString()
  surface!: string;

  @Expose()
  @ApiProperty({ example: 'Futura' })
  @IsString()
  fontHeading!: string;

  @Expose()
  @ApiProperty({ example: 'Inter' })
  @IsString()
  fontBody!: string;

  @Expose()
  @ApiPropertyOptional({ example: '#ffffff' })
  @IsString()
  @IsOptional()
  onSecondary?: string;

  @Expose()
  @ApiPropertyOptional({ example: '#831843' })
  @IsString()
  @IsOptional()
  onSurface?: string;

  @Expose()
  @ApiPropertyOptional({ example: '#f59e0b' })
  @IsString()
  @IsOptional()
  accent?: string;

  @Expose()
  @ApiPropertyOptional({ example: '#fbcfe8' })
  @IsString()
  @IsOptional()
  surfaceBorder?: string;

  @Expose()
  @ApiPropertyOptional({ example: '#f9a8d4' })
  @IsString()
  @IsOptional()
  divider?: string;

  @Expose()
  @ApiPropertyOptional({ example: '0 10px 30px rgb(131 24 67 / 0.12)' })
  @IsString()
  @IsOptional()
  surfaceShadow?: string;
}

export class PublicEventThemeDto {
  @ApiProperty({ example: 12 })
  id!: number;

  @ApiProperty({ example: 'amor-eterno' })
  key!: string;

  @ApiProperty({ example: 'Amor Eterno' })
  name!: string;

  @ApiProperty({ example: '2026-06-21T10:00:00Z' })
  version!: string;

  @ApiPropertyOptional({ type: EventThemeTokensDto, nullable: true })
  tokens?: EventThemeTokensDto | null;
}

export class PublicEventThemeResponseDto {
  @ApiProperty({ type: PublicEventThemeDto })
  eventTheme!: PublicEventThemeDto;
}
