import type { FactorizedAttrs } from '@jorgebodega/typeorm-factory';
import { DataSource } from 'typeorm';
import { faker } from '@faker-js/faker';
import { Factory } from '@jorgebodega/typeorm-factory';
import { Term } from '../../../src/terms/entities/term.entity';
import { TERM_SCOPE } from '../../../src/terms/types/term-scope.types';

export class TermFactory extends Factory<Term> {
  protected entity = Term;
  protected dataSource: DataSource;

  constructor(dataSource: DataSource) {
    super();
    this.dataSource = dataSource;
  }

  protected attrs(): FactorizedAttrs<Term> {
    return {
      code: faker.string.alphanumeric({ length: 10, casing: 'upper' }),
      title: faker.lorem.sentence(),
      content: faker.lorem.paragraphs(2),
      scope: faker.helpers.arrayElement<TERM_SCOPE>(Object.values(TERM_SCOPE)),
    };
  }

  /**
   * Creates a term with GLOBAL scope
   */
  async makeGlobal(): Promise<Term> {
    const attrs: Partial<Term> = {
      scope: TERM_SCOPE.GLOBAL,
    };
    return this.make(attrs);
  }

  /**
   * Creates and persists a term with GLOBAL scope
   */
  async createGlobal(): Promise<Term> {
    const term = await this.makeGlobal();
    return this.dataSource.getRepository(Term).save(term);
  }

  /**
   * Creates a term with PACKAGE scope
   */
  async makePackage(): Promise<Term> {
    const attrs: Partial<Term> = {
      scope: TERM_SCOPE.PACKAGE,
    };
    return this.make(attrs);
  }

  /**
   * Creates and persists a term with PACKAGE scope
   */
  async createPackage(): Promise<Term> {
    const term = await this.makePackage();
    return this.dataSource.getRepository(Term).save(term);
  }

  /**
   * Creates a global term without brand (brandId = null)
   */
  async makeGlobalWithoutBrand(attrs?: Partial<Term>): Promise<Term> {
    return this.make({
      scope: TERM_SCOPE.GLOBAL,
      ...attrs,
    });
  }

  /**
   * Creates and persists a global term without brand
   */
  async createGlobalWithoutBrand(attrs?: Partial<Term>): Promise<Term> {
    const term = await this.makeGlobalWithoutBrand(attrs);
    return this.dataSource.getRepository(Term).save(term);
  }
}
