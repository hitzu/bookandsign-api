import { IsOptional, IsNumberString, IsString } from 'class-validator';
import { Transform } from 'class-transformer';

export class FindProductsQueryDto {
  @IsOptional()
  @IsNumberString()
  @Transform(({ value }: { value: string }) =>
    value ? parseInt(value, 10) : undefined,
  )
  brandId?: number;

  @IsOptional()
  @IsString()
  term?: string;
}
