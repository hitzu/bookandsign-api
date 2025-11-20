import { IsEnum, IsString, IsObject, IsDate, IsNumber } from 'class-validator';
import { BrandKey } from '../brands.constants';
import { Expose } from 'class-transformer';

export class BrandDto {
  @Expose()
  @IsNumber()
  id!: number;

  @Expose()
  @IsEnum(BrandKey)
  key!: BrandKey;

  @Expose()
  @IsString()
  name!: string;

  @Expose()
  @IsObject()
  theme!: Record<string, any>;

  @Expose()
  @IsString()
  logoUrl: string | null;

  @Expose()
  @IsString()
  phoneNumber: string | null;

  @Expose()
  @IsString()
  email: string | null;

  @IsDate()
  createdAt!: Date;

  @IsDate()
  updatedAt!: Date;

  @IsDate()
  deletedAt!: Date | null;
}
