import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { Brand } from '../../brands/entities/brand.entity';
import { BaseTimeEntity } from '../../common/entities/base-time.entity';
import { PackageProduct } from './package-product.entity';
import { PACKAGE_STATUS } from '../types/packages-status.types';
import { PackageTerm } from '../../terms/entities/package-term.entity';

@Entity('packages')
export class Package extends BaseTimeEntity {
  @Column('integer', { name: 'brand_id' })
  brandId!: number;

  @Column('text', { unique: true })
  code!: string;

  @Column('text')
  name!: string;

  @Column('text', { nullable: true })
  description: string | null = null;

  @Column('float', { name: 'base_price', nullable: true })
  basePrice: number | null = null;

  @Column('float', { name: 'discount', nullable: true })
  discount: number | null = null;

  @Column('enum', { enum: PACKAGE_STATUS, default: PACKAGE_STATUS.DRAFT })
  status!: PACKAGE_STATUS;

  @ManyToOne(() => Brand, { nullable: true })
  @JoinColumn({ name: 'brand_id' })
  brand?: Brand | null;

  @OneToMany(() => PackageProduct, (packageProduct) => packageProduct.package)
  packageProducts?: PackageProduct[];

  @OneToMany(() => PackageTerm, (packageTerm) => packageTerm.package)
  packageTerms?: PackageTerm[];
}
