import { IsEnum, IsString, IsObject, IsOptional } from 'class-validator';
import { BrandKey } from '../brands.constants';

export class CreateBrandDto {
  @IsEnum(BrandKey)
  key!: BrandKey;

  @IsString()
  name!: string;

  @IsString()
  @IsOptional()
  logo_url: string | null;

  @IsString()
  @IsOptional()
  phone_number: string | null;

  @IsString()
  @IsOptional()
  email: string | null = null;

  @IsObject()
  theme!: Record<string, any>;
}
