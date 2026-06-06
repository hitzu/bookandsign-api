import { IsOptional, IsString } from 'class-validator';

export class FindExtrasQueryDto {
  @IsOptional()
  @IsString()
  brandId?: string;
}
