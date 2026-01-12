import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  ValidationPipe,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { CreatePromotionDto } from './dto/create-promotion.dto';
import { FindPromotionsQueryDto } from './dto/find-promotions-query.dto';
import { SetPromotionPackagesDto } from './dto/set-promotion-packages.dto';
import { UpdatePromotionDto } from './dto/update-promotion.dto';
import { PromotionsService } from './promotions.service';
import { PromotionDto } from './dto/promotion.dto';

@Controller('promotions')
@ApiTags('promotions')
export class PromotionsController {
  constructor(private readonly promotionsService: PromotionsService) {}

  @Post()
  create(
    @Body(new ValidationPipe({ transform: true, whitelist: true }))
    dto: CreatePromotionDto,
  ): Promise<PromotionDto> {
    return this.promotionsService.create(dto);
  }

  @Get()
  findAll(
    @Query(new ValidationPipe({ transform: true }))
    query: FindPromotionsQueryDto,
  ) {
    return this.promotionsService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.promotionsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body(new ValidationPipe({ transform: true, whitelist: true }))
    dto: UpdatePromotionDto,
  ) {
    return this.promotionsService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.promotionsService.remove(id);
  }

  @Post(':id/packages/bulk')
  setPackages(
    @Param('id', ParseIntPipe) id: number,
    @Body(new ValidationPipe({ transform: true, whitelist: true }))
    dto: SetPromotionPackagesDto,
  ) {
    return this.promotionsService.setPackages(id, dto);
  }
}
