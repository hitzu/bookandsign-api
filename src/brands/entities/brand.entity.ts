import { BaseTimeEntity } from '../../common/entities/base-time.entity';
import { Entity, Column, OneToMany } from 'typeorm';
import { BrandKey } from '../brands.constants';
import { Product } from '../../products/entities/product.entity';

@Entity('brands')
export class Brand extends BaseTimeEntity {
  @Column('enum', { enum: BrandKey }) key!: BrandKey;
  @Column('text') name!: string;
  @Column('text', { name: 'logo_url' }) logoUrl!: string;
  @Column('text', { name: 'phone_number' }) phoneNumber!: string;
  @Column('text') email!: string;
  @Column('jsonb', { default: () => `'{}'::jsonb` }) theme!: Record<
    string,
    any
  >;

  @OneToMany(() => Product, (product) => product.brand)
  products!: Product[];
}
