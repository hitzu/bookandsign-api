import { IsEnum, IsUUID, IsOptional, IsObject } from 'class-validator';
import { AnalyticsAction } from '../enums/analytics-action.enum';

export class TrackActionDto {
  @IsEnum(AnalyticsAction)
  action: AnalyticsAction;

  @IsUUID()
  eventToken: string;

  @IsUUID()
  @IsOptional()
  sessionId?: string;

  @IsObject()
  @IsOptional()
  metadata?: Record<string, unknown>;
}
