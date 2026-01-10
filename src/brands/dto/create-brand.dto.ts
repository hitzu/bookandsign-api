import { IsString, IsOptional } from 'class-validator';

export class CreateBrandDto {
  @IsString()
  name!: string;

  @IsString()
  @IsOptional()
  logoUrl?: string | null;

  @IsString()
  @IsOptional()
  phoneNumber?: string | null;

  @IsString()
  @IsOptional()
  email?: string | null;
}
