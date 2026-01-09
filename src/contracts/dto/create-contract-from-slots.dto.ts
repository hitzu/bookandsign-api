import { Type } from 'class-transformer';
import { IsArray, IsNumber, IsString, ValidateNested } from 'class-validator';
import { AddItemDto } from './add-item.dto';

export class CreateContractFromSlotsDto {
  @IsNumber()
  slotId!: number;

  @IsString()
  sku!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AddItemDto)
  packages!: AddItemDto[];
}
