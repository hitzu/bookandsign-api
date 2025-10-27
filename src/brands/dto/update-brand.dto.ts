import { IsEnum, IsString, IsObject } from 'class-validator';
import { BrandKey } from '../brands.constants';

export class UpdateBrandDto {
  @IsEnum(BrandKey)
  key!: BrandKey;

  @IsString()
  name!: string;

  @IsString()
  logo_url!: string;

  @IsObject()
  theme!: Record<string, any>;
}
