import { Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';

export class ListContractsQueryDto {
  @ApiPropertyOptional({
    type: Boolean,
    default: false,
    description: 'Include finalized contracts in the response',
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  includeFinalized?: boolean = false;
}
