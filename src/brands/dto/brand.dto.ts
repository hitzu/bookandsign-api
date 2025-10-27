import { IsEnum, IsString, IsObject, IsDate, IsNumber } from 'class-validator';
import { BrandKey } from '../brands.constants';

export class BrandDto {
  @IsNumber()
  id!: number;

  @IsEnum(BrandKey)
  key!: BrandKey;

  @IsString()
  name!: string;

  @IsObject()
  theme!: Record<string, any>;

  @IsDate()
  createdAt!: Date;

  @IsDate()
  updatedAt!: Date;

  @IsDate()
  deletedAt!: Date | null;
}
