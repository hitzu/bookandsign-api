import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventAnalytic } from './entities/event-analytic.entity';
import { EventAnalyticsController } from './event-analytics.controller';
import { EventAnalyticsService } from './event-analytics.service';

@Module({
  imports: [TypeOrmModule.forFeature([EventAnalytic])],
  controllers: [EventAnalyticsController],
  providers: [EventAnalyticsService],
  exports: [EventAnalyticsService],
})
export class EventAnalyticsModule {}
