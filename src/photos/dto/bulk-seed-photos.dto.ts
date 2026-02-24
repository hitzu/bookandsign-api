import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class BulkSeedPhotosDto {
  @ApiProperty({ type: String, description: 'Event token (UUID)' })
  @IsString()
  eventToken!: string;

  @ApiPropertyOptional({
    type: String,
    default: 'local/photobooth/event_1',
    description: 'Storage path base (e.g. local/photobooth/event_1)',
  })
  @IsOptional()
  @IsString()
  storageBase?: string = 'local/photobooth/event_1';

  @ApiPropertyOptional({
    type: Number,
    default: 82,
    minimum: 1,
    maximum: 500,
    description: 'Number of photos to seed (1.jpg to N.jpg)',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(500)
  count?: number = 82;
}
