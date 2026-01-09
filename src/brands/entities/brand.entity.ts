import { Column, Entity, OneToMany } from 'typeorm';

import { BaseTimeEntity } from '../../common/entities/base-time.entity';
import { Product } from '../../products/entities/product.entity';

@Entity('brands')
export class Brand extends BaseTimeEntity {
  @Column('text')
  name!: string;

  @Column('text', { name: 'logo_url', nullable: true })
  logoUrl: string | null = null;

  @Column('text', { name: 'phone_number', nullable: true })
  phoneNumber: string | null = null;

  @Column('text', { name: 'email', nullable: true })
  email: string | null = null;

  @OneToMany(() => Product, (product) => product.brand)
  products!: Product[];
}
