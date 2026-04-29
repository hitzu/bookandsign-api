import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Event } from './entities/event.entity';
import { EventType } from './entities/event-type.entity';
import { EventPhrase } from './entities/event-phrases.entity';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';
import { EventTypeService } from './event-type.service';
import { EventPhrasesService } from './event-phrases.service';
import { EventThemeService } from './event-theme.service'
import { EventTheme } from './entities/event-themes.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Event, EventType, EventPhrase, EventTheme])],
  controllers: [EventsController],
  providers: [EventsService, EventTypeService, EventPhrasesService, EventThemeService],
  exports: [EventsService],
})
export class EventsModule { }
