import { IsOptional, IsString } from 'class-validator';

export class FindPackagesQueryDto {
  @IsOptional()
  @IsString()
  brandId?: string;
}
