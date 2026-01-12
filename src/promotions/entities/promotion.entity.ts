import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';

import { Brand } from '../../brands/entities/brand.entity';
import { BaseTimeEntity } from '../../common/entities/base-time.entity';
import { PromotionPackage } from './promotion-package.entity';
import { ContractPackage } from '../../contracts/entities/contract-package.entity';

export enum PROMOTION_TYPE {
  PERCENTAGE = 'percentage',
  FIXED = 'fixed',
  BONUS = 'bonus',
}

export enum PROMOTION_STATUS {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

@Entity('promotions')
export class Promotion extends BaseTimeEntity {
  @Column('integer', { name: 'brand_id' })
  brandId!: number;

  @Column('text')
  name!: string;

  @Column('enum', { enum: PROMOTION_TYPE })
  type!: PROMOTION_TYPE;

  @Column('decimal', {
    transformer: {
      to: (value: number) => value,
      from: (value: string) => Number(value),
    },
  })
  value!: number;

  @Column('enum', { enum: PROMOTION_STATUS, default: PROMOTION_STATUS.ACTIVE })
  status: PROMOTION_STATUS = PROMOTION_STATUS.ACTIVE;

  @Column('timestamptz', { name: 'valid_from', nullable: true })
  validFrom: Date | null = null;

  @Column('timestamptz', { name: 'valid_until', nullable: true })
  validUntil: Date | null = null;

  @ManyToOne(() => Brand, { nullable: false })
  @JoinColumn({ name: 'brand_id' })
  brand!: Brand;

  @OneToMany(
    () => PromotionPackage,
    (promotionPackage) => promotionPackage.promotion,
  )
  promotionPackages?: PromotionPackage[];

  @OneToMany(
    () => ContractPackage,
    (contractPackage) => contractPackage.promotion,
  )
  contractPackages?: ContractPackage[];
}
