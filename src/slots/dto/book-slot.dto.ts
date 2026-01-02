import { IsInt, Min } from 'class-validator';

export class BookSlotDto {
  @IsInt()
  @Min(1)
  contractId!: number;
}
