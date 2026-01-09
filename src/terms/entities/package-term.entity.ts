import { Column, Entity, Index, JoinColumn, ManyToOne, Unique } from 'typeorm';
import { BaseTimeEntity } from '../../common/entities/base-time.entity';
import { Term } from './term.entity';
import { Package } from '../../packages/entities/package.entity';

@Entity('package_terms')
@Unique(['packageId', 'termId'])
@Index('package_terms_pkg_idx', ['packageId'])
@Index('package_terms_term_idx', ['termId'])
export class PackageTerm extends BaseTimeEntity {
  /**
   * Join table (aka TermPackage in the target model): links terms to packages.
   */
  @Column('integer', { name: 'package_id' })
  packageId!: number;

  @Column('integer', { name: 'term_id' })
  termId!: number;

  @ManyToOne(() => Term, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'term_id' })
  term!: Term;

  @ManyToOne(() => Package, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'package_id' })
  package!: Package;
}
