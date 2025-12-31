import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TermsService } from './terms.service';
import { Term } from './entities/term.entity';
import { PackageTerm } from './entities/package-term.entity';
import { AppDataSource as TestDataSource } from '../config/database/data-source';
import { TermFactory } from '../../test/factories/terms/term.factory';
import { PackageTermFactory } from '../../test/factories/terms/package-term.factory';
import { PackageFactory } from '../../test/factories/packages/package.factory';
import { BrandFactory } from '../../test/factories/brands/brands.factories';
import { CreateTermDto } from './dto/create-term.dto';
import { UpdateTermDto } from './dto/update-term.dto';
import { AddPackageTermDto } from './dto/add-package-term.dto';
import { RemovePackageTermDto } from './dto/remove-package-term.dto';
import { BulkUpsertPackageTermsDto } from './dto/bulk-upsert-package-terms.dto';
import { FindAllTermsQueryDto } from './dto/find-all-terms-query.dto';
import { TERM_SCOPE } from './types/term-scope.types';
import { NotFoundException } from '@nestjs/common';
import { EXCEPTION_RESPONSE } from '../config/errors/exception-response.config';

describe('TermsService', () => {
  let service: TermsService;
  let termsRepository: Repository<Term>;
  let packageTermsRepository: Repository<PackageTerm>;
  let termFactory: TermFactory;
  let packageTermFactory: PackageTermFactory;
  let packageFactory: PackageFactory;
  let brandFactory: BrandFactory;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TermsService,
        {
          provide: getRepositoryToken(Term),
          useValue: TestDataSource.getRepository(Term),
        },
        {
          provide: getRepositoryToken(PackageTerm),
          useValue: TestDataSource.getRepository(PackageTerm),
        },
      ],
    }).compile();

    service = module.get<TermsService>(TermsService);
    termsRepository = module.get<Repository<Term>>(getRepositoryToken(Term));
    packageTermsRepository = module.get<Repository<PackageTerm>>(
      getRepositoryToken(PackageTerm),
    );
    termFactory = new TermFactory(TestDataSource);
    packageTermFactory = new PackageTermFactory(TestDataSource);
    packageFactory = new PackageFactory(TestDataSource);
    brandFactory = new BrandFactory(TestDataSource);
  });

  describe('create', () => {
    describe('Happy Path - Term Creation', () => {
      it('should create a term successfully with all required fields', async () => {
        const createTermDto: CreateTermDto = {
          title: 'Test Term',
          content: 'Test Content',
          scope: TERM_SCOPE.GLOBAL,
        };

        const result = await service.create(createTermDto);

        expect(result).toBeDefined();
        expect(result.title).toBe(createTermDto.title);
        expect(result.content).toBe(createTermDto.content);
        expect(result.scope).toBe(createTermDto.scope);
        expect(result.code).toBeDefined();
        expect(result.code).toMatch(/^G-/);
        expect(result.id).toBeDefined();
      });

      it('should create a term with minimal required fields', async () => {
        const createTermDto: CreateTermDto = {
          title: 'Minimal Term',
          content: 'Minimal Content',
          scope: TERM_SCOPE.PACKAGE,
        };

        const result = await service.create(createTermDto);

        expect(result).toBeDefined();
        expect(result.title).toBe(createTermDto.title);
        expect(result.content).toBe(createTermDto.content);
        expect(result.scope).toBe(createTermDto.scope);
        expect(result.code).toBeDefined();
        expect(result.code).toMatch(/^P-/);
      });
    });

    describe('Equivalence Partitioning - Scope Values', () => {
      it.each([
        [TERM_SCOPE.GLOBAL, 'GLOBAL scope'],
        [TERM_SCOPE.PACKAGE, 'PACKAGE scope'],
      ])('should create term with %s', async (scope, description) => {
        const createTermDto: CreateTermDto = {
          title: `Term ${description}`,
          content: 'Test Content',
          scope,
        };

        const result = await service.create(createTermDto);

        expect(result.scope).toBe(scope);
      });
    });

    describe('Boundary Value Analysis - Content Length', () => {
      it('should create term with minimal content length', async () => {
        const createTermDto: CreateTermDto = {
          title: 'Short Term',
          content: 'A',
          scope: TERM_SCOPE.GLOBAL,
        };

        const result = await service.create(createTermDto);

        expect(result.content).toBe('A');
      });

      it('should create term with long content', async () => {
        const longContent = 'A'.repeat(10000);
        const createTermDto: CreateTermDto = {
          title: 'Long Term',
          content: longContent,
          scope: TERM_SCOPE.GLOBAL,
        };

        const result = await service.create(createTermDto);

        expect(result.content).toBe(longContent);
        expect(result.content.length).toBe(10000);
      });
    });
  });

  describe('findAll', () => {
    describe('Happy Path - Basic Listing', () => {
      it('should return all terms when no filters are provided', async () => {
        const term1 = await termFactory.create();
        const term2 = await termFactory.create();

        const query: FindAllTermsQueryDto = {};
        const result = await service.findAll(query);

        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBeGreaterThanOrEqual(2);
        const resultIds = result.map((t) => t.id);
        expect(resultIds).toContain(term1.id);
        expect(resultIds).toContain(term2.id);
      });
    });

    describe('Filtering - Scope', () => {
      it('should filter terms by GLOBAL scope', async () => {
        const globalTerm = await termFactory.createGlobal();
        await termFactory.createPackage();

        const query: FindAllTermsQueryDto = { scope: TERM_SCOPE.GLOBAL };
        const result = await service.findAll(query);

        expect(result.every((t) => t.scope === TERM_SCOPE.GLOBAL)).toBe(true);
        expect(result.some((t) => t.id === globalTerm.id)).toBe(true);
      });

      it('should filter terms by PACKAGE scope', async () => {
        await termFactory.createGlobal();
        const packageTerm = await termFactory.createPackage();

        const query: FindAllTermsQueryDto = { scope: TERM_SCOPE.PACKAGE };
        const result = await service.findAll(query);

        expect(result.every((t) => t.scope === TERM_SCOPE.PACKAGE)).toBe(true);
        expect(result.some((t) => t.id === packageTerm.id)).toBe(true);
      });
    });

    describe('Filtering - Search Query (q)', () => {
      it('should search terms by title', async () => {
        const term1 = await termFactory.create({
          title: 'Unique Title Search',
        });
        await termFactory.create({ title: 'Other Title' });

        const query: FindAllTermsQueryDto = { q: 'Unique' };
        const result = await service.findAll(query);

        expect(result.some((t) => t.id === term1.id)).toBe(true);
        expect(
          result.every(
            (t) => t.title.includes('Unique') || t.content.includes('Unique'),
          ),
        ).toBe(true);
      });

      it('should search terms by content', async () => {
        const term1 = await termFactory.create({
          content: 'Unique Content Search',
        });
        await termFactory.create({ content: 'Other Content' });

        const query: FindAllTermsQueryDto = { q: 'Unique' };
        const result = await service.findAll(query);

        expect(result.some((t) => t.id === term1.id)).toBe(true);
      });

      it('should perform case-insensitive search', async () => {
        const term1 = await termFactory.create({ title: 'Case Sensitive' });

        const query: FindAllTermsQueryDto = { q: 'case' };
        const result = await service.findAll(query);

        expect(result.some((t) => t.id === term1.id)).toBe(true);
      });
    });

    describe('Combined Filters', () => {
      it('should filter by scope and brandId together', async () => {
        const brand = await brandFactory.create();
        const globalTerm = await termFactory.createGlobal(brand);
        await termFactory.createPackage(brand);
        await termFactory.createGlobal();

        const query: FindAllTermsQueryDto = {
          scope: TERM_SCOPE.GLOBAL,
          // brandId filtering not yet implemented
        };
        const result = await service.findAll(query);

        expect(result.every((t) => t.scope === TERM_SCOPE.GLOBAL)).toBe(true);
        expect(result.some((t) => t.id === globalTerm.id)).toBe(true);
      });

      it('should filter by scope and search query together', async () => {
        const term1 = await termFactory.create({
          scope: TERM_SCOPE.GLOBAL,
          title: 'Searchable Term',
        });
        await termFactory.create({
          scope: TERM_SCOPE.PACKAGE,
          title: 'Searchable Term',
        });

        const query: FindAllTermsQueryDto = {
          scope: TERM_SCOPE.GLOBAL,
          q: 'Searchable',
        };
        const result = await service.findAll(query);

        expect(result.every((t) => t.scope === TERM_SCOPE.GLOBAL)).toBe(true);
        expect(result.some((t) => t.id === term1.id)).toBe(true);
      });
    });
  });

  describe('findOne', () => {
    describe('Happy Path', () => {
      it('should return a term by id', async () => {
        const term = await termFactory.create();

        const result = await service.findOne(term.id);

        expect(result).toBeDefined();
        expect(result.id).toBe(term.id);
        expect(result.title).toBe(term.title);
      });
    });

    describe('Negative Testing', () => {
      it('should throw NotFoundException when term does not exist', async () => {
        const nonExistentId = 99999;

        await expect(service.findOne(nonExistentId)).rejects.toThrow(
          NotFoundException,
        );
        await expect(service.findOne(nonExistentId)).rejects.toThrow(
          EXCEPTION_RESPONSE.TERM_NOT_FOUND.message,
        );
      });
    });
  });

  describe('update', () => {
    describe('Happy Path', () => {
      it('should update a term successfully', async () => {
        const term = await termFactory.create();
        const updateTermDto: UpdateTermDto = {
          title: 'Updated Title',
          content: 'Updated Content',
        };

        await service.update(term.id, updateTermDto);

        const updatedTerm = await termsRepository.findOne({
          where: { id: term.id },
        });
        expect(updatedTerm?.title).toBe(updateTermDto.title);
        expect(updatedTerm?.content).toBe(updateTermDto.content);
      });

      it('should update only provided fields (partial update)', async () => {
        const term = await termFactory.create({ title: 'Original Title' });
        const updateTermDto: UpdateTermDto = {
          title: 'Updated Title',
        };

        await service.update(term.id, updateTermDto);

        const updatedTerm = await termsRepository.findOne({
          where: { id: term.id },
        });
        expect(updatedTerm?.title).toBe('Updated Title');
        expect(updatedTerm?.content).toBe(term.content);
      });

      it('should update scope', async () => {
        const term = await termFactory.create({ scope: TERM_SCOPE.GLOBAL });
        const updateTermDto: UpdateTermDto = {
          scope: TERM_SCOPE.PACKAGE,
        };

        await service.update(term.id, updateTermDto);

        const updatedTerm = await termsRepository.findOne({
          where: { id: term.id },
        });
        expect(updatedTerm?.scope).toBe(TERM_SCOPE.PACKAGE);
      });
    });

    describe('Negative Testing', () => {
      it('should throw NotFoundException when updating non-existent term', async () => {
        const nonExistentId = 99999;
        const updateTermDto: UpdateTermDto = { title: 'Updated' };

        await expect(
          service.update(nonExistentId, updateTermDto),
        ).rejects.toThrow(NotFoundException);
      });
    });
  });

  describe('remove', () => {
    describe('Happy Path', () => {
      it('should soft delete a term', async () => {
        const term = await termFactory.create();

        await service.remove(term.id);

        const deletedTerm = await termsRepository.findOne({
          where: { id: term.id },
          withDeleted: true,
        });
        expect(deletedTerm?.deletedAt).toBeDefined();
      });
    });

    describe('Negative Testing', () => {
      it('should throw NotFoundException when removing non-existent term', async () => {
        const nonExistentId = 99999;

        await expect(service.remove(nonExistentId)).rejects.toThrow(
          NotFoundException,
        );
      });
    });
  });

  describe('addPackageTerm', () => {
    describe('Happy Path', () => {
      it('should create a package-term association', async () => {
        const brand = await brandFactory.create();
        const packageEntity = await packageFactory.createForBrand(brand);
        const term = await termFactory.create();

        const dto: AddPackageTermDto = {
          packageId: packageEntity.id,
          termId: term.id,
        };

        const result = await service.addPackageTerm(dto);

        expect(result).toBeDefined();
        expect(result.packageId).toBe(packageEntity.id);
        expect(result.termId).toBe(term.id);
      });

      it('should return existing association if it already exists', async () => {
        const brand = await brandFactory.create();
        const packageEntity = await packageFactory.createForBrand(brand);
        const term = await termFactory.create();
        const existing = await packageTermFactory.createForPackageAndTerm(
          packageEntity,
          term,
        );

        const dto: AddPackageTermDto = {
          packageId: packageEntity.id,
          termId: term.id,
        };

        const result = await service.addPackageTerm(dto);

        expect(result.id).toBe(existing.id);
      });
    });
  });

  describe('removePackageTerm', () => {
    describe('Happy Path', () => {
      it('should remove a package-term association', async () => {
        const brand = await brandFactory.create();
        const packageEntity = await packageFactory.createForBrand(brand);
        const term = await termFactory.create();
        await packageTermFactory.createForPackageAndTerm(packageEntity, term);

        const dto: RemovePackageTermDto = {
          packageId: packageEntity.id,
          termId: term.id,
        };

        await service.removePackageTerm(dto);

        const association = await packageTermsRepository.findOne({
          where: { packageId: packageEntity.id, termId: term.id },
        });
        expect(association).toBeNull();
      });
    });

    describe('Negative Testing', () => {
      it('should throw NotFoundException when association does not exist', async () => {
        const dto: RemovePackageTermDto = {
          packageId: 99999,
          termId: 99999,
        };

        await expect(service.removePackageTerm(dto)).rejects.toThrow(
          NotFoundException,
        );
      });
    });
  });

  describe('bulkUpsertPackageTerms', () => {
    describe('Happy Path', () => {
      it('should associate a term with multiple packages', async () => {
        const brand = await brandFactory.create();
        const package1 = await packageFactory.createForBrand(brand);
        const package2 = await packageFactory.createForBrand(brand);
        const term = await termFactory.create();

        const dto: BulkUpsertPackageTermsDto = {
          termId: term.id,
          packageIds: [package1.id, package2.id],
        };

        await service.bulkUpsertPackageTerms(dto);

        const associations = await packageTermsRepository.find({
          where: { termId: term.id },
        });
        expect(associations.length).toBe(2);
        const packageIds = associations.map((pt) => pt.packageId);
        expect(packageIds).toContain(package1.id);
        expect(packageIds).toContain(package2.id);
      });

      it('should replace existing associations for a term', async () => {
        const brand = await brandFactory.create();
        const package1 = await packageFactory.createForBrand(brand);
        const package2 = await packageFactory.createForBrand(brand);
        const package3 = await packageFactory.createForBrand(brand);
        const term = await termFactory.create();
        await packageTermFactory.createForPackageAndTerm(package1, term);
        await packageTermFactory.createForPackageAndTerm(package2, term);

        const dto: BulkUpsertPackageTermsDto = {
          termId: term.id,
          packageIds: [package2.id, package3.id],
        };

        await service.bulkUpsertPackageTerms(dto);

        const associations = await packageTermsRepository.find({
          where: { termId: term.id },
        });
        expect(associations.length).toBe(2);
        const packageIds = associations.map((pt) => pt.packageId);
        expect(packageIds).toContain(package2.id);
        expect(packageIds).toContain(package3.id);
        expect(packageIds).not.toContain(package1.id);
      });

      it('should remove all associations when packagesId is empty', async () => {
        const brand = await brandFactory.create();
        const package1 = await packageFactory.createForBrand(brand);
        const term = await termFactory.create();
        await packageTermFactory.createForPackageAndTerm(package1, term);

        const dto: BulkUpsertPackageTermsDto = {
          termId: term.id,
          packageIds: [],
        };

        await service.bulkUpsertPackageTerms(dto);

        const associations = await packageTermsRepository.find({
          where: { termId: term.id },
        });
        expect(associations.length).toBe(0);
      });
    });

    describe('Edge Cases', () => {
      it('should handle large number of packages', async () => {
        const brand = await brandFactory.create();
        const packages = await Promise.all(
          Array.from({ length: 10 }, () =>
            packageFactory.createForBrand(brand),
          ),
        );
        const term = await termFactory.create();

        const dto: BulkUpsertPackageTermsDto = {
          termId: term.id,
          packageIds: packages.map((p) => p.id),
        };

        await service.bulkUpsertPackageTerms(dto);

        const associations = await packageTermsRepository.find({
          where: { termId: term.id },
        });
        expect(associations.length).toBe(10);
      });
    });
  });

  describe('findByPackage', () => {
    describe('Happy Path', () => {
      it('should return terms associated with a package', async () => {
        const brand = await brandFactory.create();
        const packageEntity = await packageFactory.createForBrand(brand);
        const term1 = await termFactory.create();
        const term2 = await termFactory.create();
        await packageTermFactory.createForPackageAndTerm(packageEntity, term1);
        await packageTermFactory.createForPackageAndTerm(packageEntity, term2);

        const result = await service.findByPackage(packageEntity.id);

        expect(result.length).toBe(2);
        const resultIds = result.map((t) => t.id);
        expect(resultIds).toContain(term1.id);
        expect(resultIds).toContain(term2.id);
      });

      it('should return empty array when package has no terms', async () => {
        const brand = await brandFactory.create();
        const packageEntity = await packageFactory.createForBrand(brand);

        const result = await service.findByPackage(packageEntity.id);

        expect(result).toEqual([]);
      });
    });
  });
});
