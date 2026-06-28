import { IsNumber, IsOptional, IsString } from 'class-validator';

export class AddItemDto {
  @IsNumber()
  packageId!: number;

  @IsNumber()
  quantity!: number;

  /**
   * Client-chosen correlation id (e.g. a uuid) so AddExtraDto entries in the
   * same create-contract request can reference which package row they belong
   * to, before any ContractPackage id exists. Optional: extras without a
   * matching packageClientRef are simply not tied to a package (no tier discount).
   */
  @IsString()
  @IsOptional()
  clientRef?: string;
}
