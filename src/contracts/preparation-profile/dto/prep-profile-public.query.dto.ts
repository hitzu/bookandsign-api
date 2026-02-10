import { Type } from 'class-transformer';
import { IsIn, IsInt, IsNotEmpty, IsOptional, IsString, Max, Min } from 'class-validator';

export type PrepProfileAssetsMode = 'none' | 'public' | 'signed';

export class PrepProfilePublicQueryDto {
  @IsString()
  @IsNotEmpty()
  phone!: string;

  /**
   * Controls how asset URLs are returned in `answers`.
   * - none: do not add urls
   * - public: add public absolute urls
   * - signed: add signed urls (short-lived) for each asset
   */
  @IsOptional()
  @IsIn(['none', 'public', 'signed'])
  assets?: PrepProfileAssetsMode;

  /**
   * Signed URL TTL in seconds (only used when assets=signed).
   */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(10)
  @Max(60 * 60)
  expiresIn?: number;
}

