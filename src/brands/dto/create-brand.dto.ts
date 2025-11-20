import { IsEnum, IsString, IsObject, IsOptional } from 'class-validator';
import { BrandKey } from '../brands.constants';

export class CreateBrandDto {
  @IsEnum(BrandKey)
  key!: BrandKey;

  @IsString()
  name!: string;

  @IsString()
  @IsOptional()
  logoUrl: string | null;

  @IsString()
  @IsOptional()
  phoneNumber: string | null;

  @IsString()
  @IsOptional()
  email: string | null = null;

  @IsObject()
  theme!: Record<string, any>;
}
