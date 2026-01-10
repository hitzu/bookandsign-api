import { Column, Entity, Index, OneToMany } from 'typeorm';
import { BaseTimeEntity } from '../../common/entities/base-time.entity';
import { PackageTerm } from './package-term.entity';
import { TERM_SCOPE } from '../constants/term_scope.enum';
import { TermDto } from '../dto/term.dto';
import { UseDto } from '../../common/dto/use-dto.decorator';

@Entity('terms')
@UseDto(TermDto)
@Index('terms_scope_idx', ['scope'])
export class Term extends BaseTimeEntity {
  @Column('text', { unique: true })
  code!: string;

  @Column('text')
  title!: string;

  @Column('text')
  content!: string;

  @Column('enum', { enum: TERM_SCOPE })
  scope!: TERM_SCOPE;

  @OneToMany(() => PackageTerm, (packageTerm) => packageTerm.term)
  packageTerms?: PackageTerm[];
}
