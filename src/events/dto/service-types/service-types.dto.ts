import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsNumber, IsString } from 'class-validator';

export class ServiceTypeDto {
  @Expose()
  @ApiProperty({ type: Number, description: 'Service type id' })
  @IsNumber()
  id!: number;

  @Expose()
  @ApiProperty({ type: String, description: 'Service type name' })
  @IsString()
  name!: string;
}
