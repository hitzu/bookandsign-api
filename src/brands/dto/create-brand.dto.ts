import { IsEnum, IsString, IsObject } from 'class-validator';
import { BrandKey } from '../brands.constants';

export class CreateBrandDto {
  @IsEnum(BrandKey)
  key!: BrandKey;

  @IsString()
  name!: string;

  @IsString()
  logo_url: string | null;

  @IsString()
  phone_number: string | null;

  @IsString()
  email: string | null = null;

  @IsObject()
  theme!: Record<string, any>;
}
