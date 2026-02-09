import { Expose } from 'class-transformer';
import { IsNumber } from 'class-validator';

export class PrepProfileDto {
  @Expose()
  @IsNumber()
  contractId!: number;

  @Expose()
  answers!: Record<string, unknown>;

  @Expose()
  locked!: Record<string, boolean>;
}

