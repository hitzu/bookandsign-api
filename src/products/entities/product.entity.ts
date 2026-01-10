import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';

import { Brand } from '../../brands/entities/brand.entity';
import { BaseTimeEntity } from '../../common/entities/base-time.entity';
import { UseDto } from '../../common/dto/use-dto.decorator';
import { ProductDto } from '../dto/product.dto';
import { PROMOTIONAL_TYPE } from '../constants/promotional_type.enum';

@Entity('products')
@UseDto(ProductDto)
export class Product extends BaseTimeEntity {
  @Column('integer', { name: 'brand_id' })
  brandId!: number;

  @Column('text')
  name!: string;

  @Column('enum', {
    enum: PROMOTIONAL_TYPE,
    name: 'promotional_type',
    default: PROMOTIONAL_TYPE.NONE,
  })
  promotionalType: PROMOTIONAL_TYPE = PROMOTIONAL_TYPE.NONE;

  @ManyToOne(() => Brand, (brand) => brand.products)
  @JoinColumn({ name: 'brand_id' })
  brand!: Brand;
}
