import { IsEnum, IsUUID, IsOptional, IsObject, IsString, IsInt } from 'class-validator';
import { AnalyticsAction } from '../enums/analytics-action.enum';
import { AnalyticsSource } from '../enums/analytics-source.enum';

export class TrackActionDto {
  @IsEnum(AnalyticsAction)
  action: AnalyticsAction;

  @IsUUID()
  eventToken: string;

  @IsUUID()
  @IsOptional()
  sessionId?: string;

  @IsEnum(AnalyticsSource)
  @IsOptional()
  source?: AnalyticsSource;

  @IsString()
  @IsOptional()
  surface?: string;

  @IsString()
  @IsOptional()
  itemType?: string;

  @IsString()
  @IsOptional()
  variant?: string;

  @IsInt()
  @IsOptional()
  itemIndex?: number;

  @IsInt()
  @IsOptional()
  itemCount?: number;

  @IsInt()
  @IsOptional()
  photoCount?: number;

  @IsInt()
  @IsOptional()
  personCount?: number;

  @IsObject()
  @IsOptional()
  metadata?: Record<string, unknown>;
}
