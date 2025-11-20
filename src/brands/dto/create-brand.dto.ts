import { IsEnum, IsString, IsObject } from 'class-validator';
import { BrandKey } from '../brands.constants';

export class CreateBrandDto {
  @IsEnum(BrandKey)
  key!: BrandKey;

  @IsString()
  name!: string;

  @IsString()
  logo_url!: string;

  @IsString()
  phone_number!: string;

  @IsString()
  email!: string;

  @IsObject()
  theme!: Record<string, any>;
}
