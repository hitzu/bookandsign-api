import { BaseTimeEntity } from '../../common/entities/base-time.entity';
import { Entity, Column } from 'typeorm';
import { BrandKey } from '../brands.constants';

@Entity('brands')
export class Brand extends BaseTimeEntity {
  @Column('enum', { enum: BrandKey }) key!: BrandKey;
  @Column('text') name!: string;
  @Column('jsonb', { default: () => `'{}'::jsonb` }) theme!: Record<
    string,
    any
  >;
}
