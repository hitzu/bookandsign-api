import { Expose } from 'class-transformer';
import { IsDate, IsNumber, IsString } from 'class-validator';

export class BrandDto {
  @Expose()
  @IsNumber()
  id!: number;

  @Expose()
  @IsString()
  name!: string;

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
