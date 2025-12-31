import { Column, Entity, Index, OneToMany } from 'typeorm';
import { BaseTimeEntity } from '../../common/entities/base-time.entity';
import { PackageTerm } from './package-term.entity';
import { TERM_SCOPE } from '../types/term-scope.types';

@Entity('terms')
@Index('terms_scope_idx', ['scope'])
export class Term extends BaseTimeEntity {
  @Column('text', { unique: true })
  code!: string;

  @Column('integer', { name: 'package_id', nullable: true })
  packageId: number | null = null;

  @Column('text')
  title!: string;

  @Column('text')
  content!: string;

  @Column('enum', { enum: TERM_SCOPE })
  scope!: TERM_SCOPE;

  @OneToMany(() => PackageTerm, (packageTerm) => packageTerm.term)
  packageTerms?: PackageTerm[];
}
