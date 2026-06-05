import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ContractSlot } from '../contracts/entities/contract-slot.entity';
import { Contract } from '../contracts/entities/contract.entity';
import { Brand } from '../brands/entities/brand.entity';
import { Slot } from './entities/slot.entity';
import { SlotsController } from './slots.controller';
import { SlotsService } from './slots.service';

@Module({
  imports: [TypeOrmModule.forFeature([Slot, ContractSlot, Contract, Brand])],
  controllers: [SlotsController],
  providers: [SlotsService],
  exports: [SlotsService],
})
export class SlotsModule {}
