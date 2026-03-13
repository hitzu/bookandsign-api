import { IsArray, IsNumber } from 'class-validator';

export class BulkUpsertPackageTermsDto {
  @IsArray()
  @IsNumber({}, { each: true })
  packageIds!: number[];
}

/** Service input: DTO body + termId from route param */
export type BulkUpsertPackageTermsInput = BulkUpsertPackageTermsDto & {
  termId: number;
};
