import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import { plainToInstance } from 'class-transformer';

import { FindPromotionsQueryDto } from './dto/find-promotions-query.dto';
import { CreatePromotionDto } from './dto/create-promotion.dto';
import { SetPromotionPackageTiersDto } from './dto/set-promotion-package-tiers.dto';
import { UpdatePromotionDto } from './dto/update-promotion.dto';
import { PromotionPackageViewDto } from './dto/promotion-package-tier-view.dto';
import { PromotionPackage } from './entities/promotion-package.entity';
import { Promotion, PROMOTION_STATUS } from './entities/promotion.entity';
import { PromotionDto } from './dto/promotion.dto';

export interface ActiveTierInfo {
  promotionId: number;
  tiers: { order: number; discountPercentage: number }[];
}

@Injectable()
export class PromotionsService {
  private readonly logger = new Logger(PromotionsService.name);

  constructor(
    @InjectRepository(Promotion)
    private readonly promotionsRepository: Repository<Promotion>,
    @InjectRepository(PromotionPackage)
    private readonly promotionPackagesRepository: Repository<PromotionPackage>,
  ) { }

  async create(dto: CreatePromotionDto): Promise<PromotionDto> {
    const status = dto.status ?? PROMOTION_STATUS.ACTIVE;
    if (status === PROMOTION_STATUS.ACTIVE) {
      await this.assertSingleActivePromotionPerBrand(dto.brandId);
    }
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
    const promotionsWithPackages = promotions.map((promotion) => ({
      ...promotion,
      packages: this.groupTiersByPackage(promotion.promotionPackages ?? []),
    }));
    return plainToInstance(PromotionDto, promotionsWithPackages, {
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
    const promotion = await this.findOne(id);
    const nextStatus = dto.status ?? promotion.status;
    if (nextStatus === PROMOTION_STATUS.ACTIVE) {
      await this.assertSingleActivePromotionPerBrand(
        dto.brandId ?? promotion.brandId,
        id,
      );
    }
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
    dto: SetPromotionPackageTiersDto,
  ): Promise<{ message: string }> {
    try {
      await this.findOne(promotionId);

      const seenTiers = new Set<string>();
      const rows: PromotionPackage[] = [];
      for (const pkg of dto.packages) {
        for (const tier of pkg.tiers) {
          const key = `${pkg.packageId}-${tier.order}`;
          if (seenTiers.has(key)) {
            throw new BadRequestException(
              `Duplicate tier order ${tier.order} for package ${pkg.packageId}`,
            );
          }
          seenTiers.add(key);
          rows.push(
            this.promotionPackagesRepository.create({
              promotionId,
              packageId: pkg.packageId,
              tierOrder: tier.order,
              discountPercentage: tier.discountPercentage,
            }),
          );
        }
      }

      await this.promotionPackagesRepository.delete({ promotionId });
      if (rows.length > 0) {
        await this.promotionPackagesRepository.save(rows);
      }
      return { message: 'Package tiers set for promotion successfully' };
    } catch (error) {
      this.logger.error(error);
      throw new BadRequestException(
        `${error}`,
      );
    }
  }

  /**
   * Resolves the brand's currently active promotion tiers for the given packages.
   * Used by ContractsService to compute extra discounts server-side — never trust
   * a discount/promotionId coming from the client.
   */
  async getActiveTierMapForBrand(
    brandId: number,
    packageIds: number[],
  ): Promise<Map<number, ActiveTierInfo>> {
    const result = new Map<number, ActiveTierInfo>();
    if (packageIds.length === 0) {
      return result;
    }

    const promotion = await this.findActivePromotionInWindow(brandId, [
      'promotionPackages',
    ]);
    if (!promotion) {
      return result;
    }

    for (const row of promotion.promotionPackages ?? []) {
      if (!packageIds.includes(row.packageId)) {
        continue;
      }
      if (!result.has(row.packageId)) {
        result.set(row.packageId, { promotionId: promotion.id, tiers: [] });
      }
      result.get(row.packageId)!.tiers.push({
        order: row.tierOrder,
        discountPercentage: row.discountPercentage,
      });
    }
    for (const entry of result.values()) {
      entry.tiers.sort((a, b) => a.order - b.order);
    }
    return result;
  }

  /**
   * Resolves the brand's currently active promotion (status ACTIVE and within
   * validFrom/validUntil), if any. Used by ContractsService to apply the flat
   * promotion-level discount (type/value) to packages — separate from the
   * per-extra tiers resolved by getActiveTierMapForBrand.
   */
  async getActivePromotionForBrand(brandId: number): Promise<Promotion | null> {
    return this.findActivePromotionInWindow(brandId);
  }

  private async findActivePromotionInWindow(
    brandId: number,
    relations: string[] = [],
  ): Promise<Promotion | null> {
    const promotion = await this.promotionsRepository.findOne({
      where: { brandId, status: PROMOTION_STATUS.ACTIVE },
      relations,
    });
    if (!promotion) {
      return null;
    }

    const now = new Date();
    if (promotion.validFrom && promotion.validFrom > now) {
      return null;
    }
    if (promotion.validUntil && promotion.validUntil < now) {
      return null;
    }
    return promotion;
  }

  private async assertSingleActivePromotionPerBrand(
    brandId: number,
    excludePromotionId?: number,
  ): Promise<void> {
    const existing = await this.promotionsRepository.findOne({
      where: { brandId, status: PROMOTION_STATUS.ACTIVE },
    });
    if (existing && existing.id !== excludePromotionId) {
      throw new ConflictException(
        `Brand ${brandId} already has an active promotion (id ${existing.id})`,
      );
    }
  }

  private groupTiersByPackage(
    rows: PromotionPackage[],
  ): PromotionPackageViewDto[] {
    const map = new Map<
      number,
      {
        packageId: number;
        packageName: string;
        tiers: { order: number; discountPercentage: number }[];
      }
    >();
    for (const row of rows) {
      if (!map.has(row.packageId)) {
        map.set(row.packageId, {
          packageId: row.packageId,
          packageName: row.package?.name ?? '',
          tiers: [],
        });
      }
      map.get(row.packageId)!.tiers.push({
        order: row.tierOrder,
        discountPercentage: row.discountPercentage,
      });
    }
    for (const group of map.values()) {
      group.tiers.sort((a, b) => a.order - b.order);
    }
    return Array.from(map.values());
  }
}
