import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';

import { FindPromotionsQueryDto } from './dto/find-promotions-query.dto';
import { CreatePromotionDto } from './dto/create-promotion.dto';
import { SetPromotionPackagesDto } from './dto/set-promotion-packages.dto';
import { UpdatePromotionDto } from './dto/update-promotion.dto';
import { PromotionPackage } from './entities/promotion-package.entity';
import { Promotion } from './entities/promotion.entity';
import { PromotionDto } from './dto/promotion.dto';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class PromotionsService {
  private readonly logger = new Logger(PromotionsService.name);

  constructor(
    @InjectRepository(Promotion)
    private readonly promotionsRepository: Repository<Promotion>,
    @InjectRepository(PromotionPackage)
    private readonly promotionPackagesRepository: Repository<PromotionPackage>,
  ) {}

  async create(dto: CreatePromotionDto): Promise<PromotionDto> {
    try {
      this.logger.log({ dto }, 'Creating promotion');
      const promotion = this.promotionsRepository.create({
        ...dto,
        validFrom: dto.validFrom ?? null,
        validUntil: dto.validUntil ?? null,
      });
      const savedPromotion = await this.promotionsRepository.save(promotion);
      return plainToInstance(PromotionDto, savedPromotion, {
        excludeExtraneousValues: true,
      });
    } catch (error) {
      this.logger.error(error, 'Error creating promotion');
      throw new BadRequestException('Error creating promotion');
    }
  }

  async findAll(query: FindPromotionsQueryDto): Promise<PromotionDto[]> {
    const where: FindOptionsWhere<Promotion> = {};
    if (query.brandId) {
      where.brandId = Number(query.brandId);
    }
    if (query.status) {
      where.status = query.status;
    }
    const promotions = await this.promotionsRepository.find({
      where,
      relations: ['brand', 'promotionPackages', 'promotionPackages.package'],
    });
    return plainToInstance(PromotionDto, promotions, {
      excludeExtraneousValues: true,
    });
  }

  async findOne(id: number): Promise<Promotion> {
    const promotion = await this.promotionsRepository.findOne({
      where: { id },
      relations: ['brand', 'promotionPackages', 'promotionPackages.package'],
    });
    if (!promotion) {
      throw new NotFoundException('Promotion not found');
    }
    return promotion;
  }

  async update(id: number, dto: UpdatePromotionDto) {
    await this.findOne(id);
    return await this.promotionsRepository.update(id, {
      ...dto,
      validFrom: dto.validFrom ?? undefined,
      validUntil: dto.validUntil ?? undefined,
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    return await this.promotionsRepository.softDelete(id);
  }

  async setPackages(
    promotionId: number,
    dto: SetPromotionPackagesDto,
  ): Promise<{ message: string }> {
    await this.findOne(promotionId);
    await this.promotionPackagesRepository.delete({ promotionId });
    const rows = dto.packageIds.map((packageId) =>
      this.promotionPackagesRepository.create({ promotionId, packageId }),
    );
    if (rows.length > 0) {
      await this.promotionPackagesRepository.save(rows);
    }
    return { message: 'Packages set for promotion successfully' };
  }
}
