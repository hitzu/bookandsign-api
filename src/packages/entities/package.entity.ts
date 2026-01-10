import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';

import { Brand } from '../../brands/entities/brand.entity';
import { BaseTimeEntity } from '../../common/entities/base-time.entity';
import { PackageTerm } from '../../terms/entities/package-term.entity';
import { PACKAGE_STATUS } from '../types/packages-status.types';
import { PackageProduct } from './package-product.entity';

@Entity('packages')
export class Package extends BaseTimeEntity {
  @Column('integer', { name: 'brand_id' })
  brandId!: number;

  @Column('text')
  name!: string;

  @Column('decimal', {
    name: 'base_price',
    nullable: true,
    transformer: {
      to: (value: number | null) => value,
      from: (value: string | null) => (value == null ? null : Number(value)),
    },
  })
  basePrice: number | null = null;

  @Column('enum', {
    enum: PACKAGE_STATUS,
    name: 'status',
    default: PACKAGE_STATUS.ACTIVE,
  })
  status: PACKAGE_STATUS = PACKAGE_STATUS.ACTIVE;

  @ManyToOne(() => Brand, { nullable: true })
  @JoinColumn({ name: 'brand_id' })
  brand?: Brand | null;

  @OneToMany(() => PackageProduct, (packageProduct) => packageProduct.package)
  packageProducts?: PackageProduct[];

  @OneToMany(() => PackageTerm, (packageTerm) => packageTerm.package)
  packageTerms?: PackageTerm[];
}
