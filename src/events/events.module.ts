import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventPhrase } from './entities/event-phrases.entity';
import { EventTheme } from './entities/event-themes.entity';
import { EventType } from './entities/event-type.entity';
import { Event } from './entities/event.entity';
import { ServiceType } from './entities/service-type.entity';
import { EventPhrasesService } from './event-phrases.service';
import { EventThemeService } from './event-theme.service';
import { EventTypeService } from './event-type.service';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';
import { ServiceTypeService } from './service-type.service';

@Module({
  imports: [TypeOrmModule.forFeature([Event, EventType, ServiceType, EventPhrase, EventTheme])],
  controllers: [EventsController],
  providers: [EventsService, EventTypeService, ServiceTypeService, EventPhrasesService, EventThemeService],
  exports: [EventsService],
})
export class EventsModule { }
