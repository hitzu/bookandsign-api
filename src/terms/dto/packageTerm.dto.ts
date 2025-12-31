import { Expose, Type } from 'class-transformer';
import { IsNumber } from 'class-validator';
import { PackageResponseDto } from '../../packages/dto/package-response.dto';

export class PackageTermDto {
  @Expose()
  @IsNumber()
  id!: number;

  @Expose()
  @IsNumber()
  packageId!: number;

  @Expose()
  @IsNumber()
  termId!: number;

  @Expose()
  @Type(() => PackageResponseDto)
  package!: PackageResponseDto;
}
