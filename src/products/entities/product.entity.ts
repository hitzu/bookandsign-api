import { Brand } from '../../brands/entities/brand.entity';
import { BaseTimeEntity } from '../../common/entities/base-time.entity';
<<<<<<< HEAD
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
=======
import { Column, Entity, ManyToOne } from 'typeorm';
>>>>>>> 9278f96 (feat: products functionality created)
import { PRODUCT_STATUS } from '../types/products-status.types';

@Entity('products')
export class Product extends BaseTimeEntity {
  @Column('text')
  name!: string;
  @Column('text', { nullable: true })
  description: string | null = null;
  @Column('text', { name: 'image_url', nullable: true })
  imageUrl: string | null = null;
  @Column('float')
  price!: number;
  @Column('float', { name: 'discount_percentage', nullable: true })
  discountPercentage: number | null = null;
  @Column('enum', { enum: PRODUCT_STATUS, default: PRODUCT_STATUS.DRAFT })
  status!: PRODUCT_STATUS;
  @Column('integer', { name: 'brand_id' })
  brandId!: number;
  @ManyToOne(() => Brand, (brand) => brand.products)
  @JoinColumn({ name: 'brand_id' })
  brand!: Brand;
}
