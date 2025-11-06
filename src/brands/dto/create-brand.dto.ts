import { IsEnum, IsString, IsObject } from 'class-validator';
import { BrandKey } from '../brands.constants';

export class CreateBrandDto {
  @IsEnum(BrandKey)
  key!: BrandKey;

  @IsString()
  name!: string;

  @IsObject()
  theme!: Record<string, any>;
}
