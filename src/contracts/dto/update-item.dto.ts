import { IsNumber, IsOptional } from 'class-validator';

export class UpdateItemDto {
  @IsNumber()
  @IsOptional()
  quantity?: number;
}


