import { IsOptional, IsNumberString, IsString } from 'class-validator';

export class FindProductsQueryDto {
  @IsOptional()
  @IsNumberString()
  brandId?: number;

  @IsOptional()
  @IsString()
  term?: string;
}
