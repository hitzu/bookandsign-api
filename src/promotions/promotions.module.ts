import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { PromotionPackage } from './entities/promotion-package.entity';
import { Promotion } from './entities/promotion.entity';
import { PromotionsController } from './promotions.controller';
import { PromotionsService } from './promotions.service';

@Module({
  imports: [TypeOrmModule.forFeature([Promotion, PromotionPackage])],
  controllers: [PromotionsController],
  providers: [PromotionsService],
})
export class PromotionsModule {}

