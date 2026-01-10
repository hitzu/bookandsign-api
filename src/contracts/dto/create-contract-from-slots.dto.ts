import { Type } from 'class-transformer';
import {
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { AddItemDto } from './add-item.dto';

export class CreateContractFromSlotsDto {
  @IsNumber()
  userId!: number;

  @IsNumber()
  slotId!: number;

  @IsString()
  sku!: string;

  @IsString()
  clientName!: string;

  @IsString()
  @IsOptional()
  clientPhone?: string | null;

  @IsString()
  @IsOptional()
  clientEmail?: string | null;

  @IsNumber()
  subtotal!: number;

  @IsNumber()
  discountTotal!: number;

  @IsNumber()
  total!: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AddItemDto)
  packages!: AddItemDto[];
}
