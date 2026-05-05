import { IsEnum, IsUUID, IsOptional, IsObject } from 'class-validator';
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

  @IsObject()
  @IsOptional()
  metadata?: Record<string, unknown>;
}
