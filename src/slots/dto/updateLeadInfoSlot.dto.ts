import { IsEmail, IsOptional, IsString } from 'class-validator';

export class UpdateLeadInfoSlotDto {
  @IsString()
  @IsOptional()
  leadName?: string;

  @IsEmail()
  @IsOptional()
  leadEmail?: string;

  @IsString()
  @IsOptional()
  leadPhone?: string;
}
