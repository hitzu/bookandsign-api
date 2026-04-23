import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';

import { Photo } from '../photos/entities/photo.entity';
import { Session } from '../photos/entities/session.entity';
import { EventsModule } from '../events/events.module';
import { PhotosModule } from '../photos/photos.module';
import { ReconciliationController } from './reconciliation.controller';
import { ReconciliationService } from './reconciliation.service';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    TypeOrmModule.forFeature([Photo, Session]),
    EventsModule,
    PhotosModule,
  ],
  controllers: [ReconciliationController],
  providers: [ReconciliationService],
})
export class ReconciliationModule { }
