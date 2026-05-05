import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsUUID } from 'class-validator';

export class ConfirmGifDto {
  @ApiProperty({ description: 'Session UUID', example: 'b5f4a6e2-3c1d-4f8a-9b1e-1a2b3c4d5e6f' })
  @IsUUID('4')
  sessionToken!: string;

  @ApiPropertyOptional({
    description: 'Storage path returned by the presigned endpoint',
    example: 'photobooth/42/gifs/b5f4a6e2-3c1d-4f8a-9b1e-1a2b3c4d5e6f.gif',
  })
  @IsString()
  gifPath!: string;
}
