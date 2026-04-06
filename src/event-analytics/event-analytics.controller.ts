import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  Headers,
  HttpCode,
} from '@nestjs/common';
import { Public } from '../auth/decorators/public.decorator';
import { EventAnalyticsService } from './event-analytics.service';
import { TrackActionDto } from './dto/track-action.dto';

@Controller('event-analytics')
export class EventAnalyticsController {
  constructor(private readonly analyticsService: EventAnalyticsService) {}

  @Public()
  @Post('track')
  @HttpCode(204)
  async track(
    @Body() dto: TrackActionDto,
    @Headers('user-agent') userAgent: string,
  ): Promise<void> {
    await this.analyticsService.track(dto, userAgent);
  }

  @Get(':eventToken/summary')
  async summary(@Param('eventToken') eventToken: string) {
    return this.analyticsService.getSummary(eventToken);
  }

  @Get(':eventToken/actions')
  async actions(
    @Param('eventToken') eventToken: string,
    @Query('page') page = 1,
    @Query('limit') limit = 50,
  ) {
    return this.analyticsService.getActions(eventToken, +page, +limit);
  }
}
