import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ContractsController } from './contracts.controller';
import { ContractsService } from './contracts.service';
import { Contract } from './entities/contract.entity';
import { ContractPackage } from './entities/contract-package.entity';
import { Package } from '../packages/entities/package.entity';
import { Slot } from '../slots/entities/slot.entity';
import { PaymentsModule } from '../payments/payments.module';
import { ContractSlot } from './entities/contract-slot.entity';

@Module({
  imports: [
    PaymentsModule,
    TypeOrmModule.forFeature([
      Contract,
      ContractPackage,
      Slot,
      Package,
      ContractSlot,
    ]),
  ],
  controllers: [ContractsController],
  providers: [ContractsService],
})
export class ContractsModule {}
