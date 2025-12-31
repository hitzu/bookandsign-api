import { IsArray, IsNumber } from 'class-validator';

export class BulkUpsertPackageTermsDto {
  @IsArray()
  @IsNumber({}, { each: true })
  packageIds!: number[];

  @IsNumber()
  termId!: number;
}
