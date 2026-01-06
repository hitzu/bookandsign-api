import { Expose } from 'class-transformer';
import { IsEnum, IsNumber, IsString } from 'class-validator';

import { CONTRACT_STATUS } from '../types/contract-status.types';

export class ContractDto {
  @Expose()
  @IsNumber()
  id!: number;

  @Expose()
  @IsEnum(CONTRACT_STATUS)
  status!: CONTRACT_STATUS;

  @Expose()
  @IsNumber()
  totalAmount!: number;

  @Expose()
  @IsString()
  token!: string;
}
