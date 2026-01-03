import { ApiProperty } from '@nestjs/swagger';
import { Matches } from 'class-validator';

export class FindSlotsQueryDto {
  @ApiProperty({
    type: String,
    required: true,
    example: '2023-12-31',
    description: 'Date in YYYY-MM-DD format.',
  })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'date must be in YYYY-MM-DD format',
  })
  date!: string;
}
