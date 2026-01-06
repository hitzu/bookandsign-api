import { Type } from 'class-transformer';
import { IsDate, IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';

import { PAYMENT_METHOD } from '../types/payment-method.types';

export class AddPaymentDto {
  @IsNumber()
  amount!: number;

  @IsEnum(PAYMENT_METHOD)
  method!: PAYMENT_METHOD;

  @Type(() => Date)
  @IsDate()
  receivedAt!: Date;

  @IsString()
  @IsOptional()
  note?: string;
}


