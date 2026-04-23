import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventsModule } from '../events/events.module';
import { Photo } from './entities/photo.entity';
import { Session } from './entities/session.entity';
import { PhotosController } from './photos.controller';
import { PhotosService } from './photos.service';
import { SessionsCache } from './sessions.cache';
import { SessionsController } from './sessions.controller';
import { SessionsService } from './sessions.service';

@Module({
  imports: [TypeOrmModule.forFeature([Photo, Session]), EventsModule],
  controllers: [PhotosController, SessionsController],
  providers: [PhotosService, SessionsService, SessionsCache],
  exports: [PhotosService, SessionsService, SessionsCache],
})
export class PhotosModule {}
