import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsArray, IsNumber, ValidateNested } from "class-validator";

export class BulkPhrasesDto {
  @ApiProperty({
    type: Number,
    description: 'event type'
  })
  @IsNumber()
  eventTypeId!: number;

  @ApiProperty({
    type: Array,
    description: 'phrases'
  })
  @IsArray()
  phrases!: string[]
}