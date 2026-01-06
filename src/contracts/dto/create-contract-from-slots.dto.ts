import { Type } from 'class-transformer';
import { IsArray, IsNumber, ValidateNested } from 'class-validator';
import { AddItemDto } from './add-item.dto';

export class CreateContractFromSlotsDto {
  @IsNumber()
  slotId!: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AddItemDto)
  packages!: AddItemDto[];
}
