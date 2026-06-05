import { IsArray, IsNumber } from 'class-validator';

export class BulkUpsertBrandTermsDto {
  @IsArray()
  @IsNumber({}, { each: true })
  brandIds!: number[];
}

/** Service input: DTO body + termId from route param */
export type BulkUpsertBrandTermsInput = BulkUpsertBrandTermsDto & {
  termId: number;
};
