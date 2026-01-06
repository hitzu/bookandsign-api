import { Expose, Type } from 'class-transformer';
import { IsArray, IsNumber } from 'class-validator';

import { SlotDto } from '../../slots/dto/slot.dto';
import { ContractDto } from './contract.dto';
import { ContractPackageDto } from './contract-package.dto';
import { PaymentDto } from './payment.dto';

export class ContractDetailDto {
  @Expose()
  @Type(() => ContractDto)
  contract!: ContractDto;

  @Expose()
  @IsArray()
  @Type(() => SlotDto)
  slots!: SlotDto[];

  @Expose()
  @IsArray()
  @Type(() => ContractPackageDto)
  items!: ContractPackageDto[];

  @Expose()
  @IsArray()
  @Type(() => PaymentDto)
  payments!: PaymentDto[];

  @Expose()
  @IsNumber()
  paidAmount!: number;
}
