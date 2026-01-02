import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ContractsSlotsController } from './contracts-slots.controller';
import { Slot } from './entities/slot.entity';
import { SlotsController } from './slots.controller';
import { SlotsService } from './slots.service';

@Module({
  imports: [TypeOrmModule.forFeature([Slot])],
  controllers: [SlotsController, ContractsSlotsController],
  providers: [SlotsService],
  exports: [SlotsService],
})
export class SlotsModule {}
