import type { FactorizedAttrs } from '@jorgebodega/typeorm-factory';
import { DataSource } from 'typeorm';
import { Factory } from '@jorgebodega/typeorm-factory';
import { PackageTerm } from '../../../src/terms/entities/package-term.entity';
import { Term } from '../../../src/terms/entities/term.entity';
import { Package } from '../../../src/packages/entities/package.entity';

export class PackageTermFactory extends Factory<PackageTerm> {
  protected entity = PackageTerm;
  protected dataSource: DataSource;

  constructor(dataSource: DataSource) {
    super();
    this.dataSource = dataSource;
  }

  protected attrs(): FactorizedAttrs<PackageTerm> {
    return {
      packageId: 0,
      termId: 0,
    };
  }

  /**
   * Creates a package-term association
   */
  async makeForPackageAndTerm(
    packageEntity: Package,
    term: Term,
  ): Promise<PackageTerm> {
    return this.make({
      packageId: packageEntity.id,
      termId: term.id,
      package: packageEntity,
      term,
    });
  }

  /**
   * Creates and persists a package-term association
   */
  async createForPackageAndTerm(
    packageEntity: Package,
    term: Term,
  ): Promise<PackageTerm> {
    const packageTerm = await this.makeForPackageAndTerm(packageEntity, term);
    return this.dataSource.getRepository(PackageTerm).save(packageTerm);
  }
}

