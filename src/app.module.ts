import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { BrandsModule } from './brands/brands.module';
import { getTypeOrmConfig } from './config/database';
import { LoggerModule } from 'nestjs-pino';
import { getLoggerConfigs } from './config/logger/logger.config';

@Module({
  imports: [
    LoggerModule.forRoot(getLoggerConfigs()),
    TypeOrmModule.forRoot(getTypeOrmConfig()),
    BrandsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
