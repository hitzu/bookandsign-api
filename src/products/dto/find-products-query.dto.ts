import { IsOptional, IsString } from 'class-validator';

export class FindProductsQueryDto {
  @IsOptional()
  @IsString()
  brandId?: string;

  @IsOptional()
  @IsString()
  term?: string;
}
