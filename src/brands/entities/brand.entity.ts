import { BaseTimeEntity } from '../../common/entities/base-time.entity';
import { Entity, Column, OneToMany } from 'typeorm';
import { BrandKey } from '../brands.constants';
import { Product } from '../../products/entities/product.entity';

@Entity('brands')
export class Brand extends BaseTimeEntity {
  @Column('enum', { enum: BrandKey }) key!: BrandKey;
  @Column('text') name!: string;
  @Column('text', { name: 'logo_url', nullable: true })
  logoUrl: string | null = null;
  @Column('text', { name: 'phone_number', nullable: true })
  phoneNumber: string | null = null;
  @Column('text', { nullable: true }) email: string | null = null;
  @Column('jsonb', { default: () => `'{}'::jsonb` }) theme!: Record<
    string,
    any
  >;

  @OneToMany(() => Product, (product) => product.brand)
  products!: Product[];
}
