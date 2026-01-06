import { Brand } from '../../brands/entities/brand.entity';
import { BaseTimeEntity } from '../../common/entities/base-time.entity';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { PRODUCT_STATUS } from '../types/products-status.types';
import { UseDto } from '../../common/dto/use-dto.decorator';
import { ProductDto } from '../dto/product.dto';

@Entity('products')
@UseDto(ProductDto)
export class Product extends BaseTimeEntity {
  @Column('text')
  name!: string;

  @Column('text', { nullable: true })
  description: string | null = null;

  @Column('text', { name: 'image_url', nullable: true })
  imageUrl: string | null = null;

  @Column('float', { nullable: true })
  price: number | null = null;

  @Column('float', { name: 'discount_percentage', nullable: true })
  discountPercentage: number | null = null;

  @Column('enum', { enum: PRODUCT_STATUS, default: PRODUCT_STATUS.DRAFT })
  status!: PRODUCT_STATUS;

  @Column('integer', { name: 'brand_id' })
  brandId!: number;

  @Column('boolean', { name: 'is_promotional', default: false })
  isPromotional!: boolean;

  @Column('text', { name: 'promotional_text', nullable: true })
  promotionalText: string | null = null;

  @ManyToOne(() => Brand, (brand) => brand.products)
  @JoinColumn({ name: 'brand_id' })
  brand!: Brand;
}
