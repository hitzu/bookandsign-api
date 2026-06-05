import { Column, Entity, Index, JoinColumn, ManyToOne, Unique } from 'typeorm';
import { BaseTimeEntity } from '../../common/entities/base-time.entity';
import { Term } from './term.entity';
import { Brand } from '../../brands/entities/brand.entity';

@Entity('brand_terms')
@Unique(['brandId', 'termId'])
@Index('brand_terms_brand_idx', ['brandId'])
@Index('brand_terms_term_idx', ['termId'])
export class BrandTerm extends BaseTimeEntity {
  @Column('integer', { name: 'brand_id' })
  brandId!: number;

  @Column('integer', { name: 'term_id' })
  termId!: number;

  @ManyToOne(() => Term, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'term_id' })
  term!: Term;

  @ManyToOne(() => Brand, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'brand_id' })
  brand!: Brand;
}
