import { Brand } from '../../brands/entities/brand.entity';
import { BaseTimeEntity } from '../../common/entities/base-time.entity';
import { Column, Entity, ManyToOne } from 'typeorm';
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
  @ManyToOne(() => Brand, (brand) => brand.products)
  brand!: Brand;
}
