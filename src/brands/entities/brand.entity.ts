import { BaseTimeEntity } from 'src/common/entities/base.entity';
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { BrandKey } from '../brands.constants';

@Entity('brands')
export class Brand extends BaseTimeEntity {
  @PrimaryGeneratedColumn('increment') id!: number;
  @Column('enum', { enum: BrandKey }) key!: BrandKey;
  @Column('text') name!: string;
  @Column('jsonb', { default: () => `'{}'::jsonb` }) theme!: Record<
    string,
    any
  >;
}
