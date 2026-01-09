import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';

import { BaseTimeEntity } from '../../common/entities/base-time.entity';
import { Package } from '../../packages/entities/package.entity';
import { Promotion } from './promotion.entity';

@Entity('promotion_packages')
@Index(['promotionId', 'packageId'], { unique: true })
export class PromotionPackage extends BaseTimeEntity {
  @Column('integer', { name: 'promotion_id' })
  promotionId!: number;

  @Column('integer', { name: 'package_id' })
  packageId!: number;

  @ManyToOne(() => Promotion, (promotion) => promotion.promotionPackages, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'promotion_id' })
  promotion!: Promotion;

  @ManyToOne(() => Package, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'package_id' })
  package!: Package;
}

