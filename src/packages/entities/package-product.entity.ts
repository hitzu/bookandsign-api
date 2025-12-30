import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { Package } from './package.entity';
import { Product } from '../../products/entities/product.entity';
import { BaseTimeEntity } from '../../common/entities/base-time.entity';

@Entity('package_products')
@Index(['packageId', 'productId'], { unique: true })
export class PackageProduct extends BaseTimeEntity {
  @Column('integer', { name: 'package_id' })
  packageId!: number;

  @Column('integer', { name: 'product_id' })
  productId!: number;

  @Column('integer', { default: 1 })
  quantity!: number;

  @ManyToOne(() => Package, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'package_id' })
  package!: Package;

  @ManyToOne(() => Product, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'product_id' })
  product!: Product;
}
