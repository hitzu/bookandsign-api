import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CreatePhotoDto {
  @ApiProperty({ type: String, description: 'Event token (UUID)' })
  @IsString()
  eventToken!: string;

  @ApiProperty({
    type: String,
    description: 'Storage path (e.g. event_6/photo_20250217_143022_a1b2c3.jpg)',
  })
  @IsString()
  storagePath!: string;

  @ApiProperty({ type: String, description: 'Public URL of the uploaded image' })
  @IsString()
  publicUrl!: string;
}
