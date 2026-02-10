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
import { ContractPreparationProfile } from './entities/contract-preparation-profile.entity';
import { ContractsPreparationProfileService } from './preparation-profile/contracts-preparation-profile.service';
import { PrepProfileUploadsService } from './preparation-profile/prep-profile-uploads.service';

@Module({
  imports: [
    PaymentsModule,
    TypeOrmModule.forFeature([
      Contract,
      ContractPackage,
      Slot,
      Package,
      ContractSlot,
      ContractPreparationProfile,
    ]),
  ],
  controllers: [ContractsController],
  providers: [
    ContractsService,
    ContractsPreparationProfileService,
    PrepProfileUploadsService,
  ],
})
export class ContractsModule { }
