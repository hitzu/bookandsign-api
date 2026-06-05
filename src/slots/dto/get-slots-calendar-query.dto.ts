import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, Matches } from 'class-validator';

export class GetSlotsCalendarQueryDto {
  @ApiProperty({
    type: Number,
    required: true,
    example: 2026,
    description: 'Year in YYYY format.',
  })
  @Matches(/^\d{4}$/, {
    message: 'year must be in YYYY format',
  })
  year!: string;

  @ApiProperty({
    type: Number,
    required: true,
    example: 1,
    description: 'Month number (1-12).',
  })
  @Matches(/^(0?[1-9]|1[0-2])$/, {
    message: 'month must be between 1 and 12',
  })
  month!: string;

  @ApiPropertyOptional({
    type: Number,
    example: 1,
    description: 'Brand ID to calculate monthly risk.',
  })
  @IsOptional()
  @Matches(/^\d+$/, { message: 'brandId must be a positive integer' })
  brandId?: string;
}

