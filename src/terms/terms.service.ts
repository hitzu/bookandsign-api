import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Term } from './entities/term.entity';
import { PackageTerm } from './entities/package-term.entity';
import { CreateTermDto } from './dto/create-term.dto';
import { UpdateTermDto } from './dto/update-term.dto';
import { AddPackageTermDto } from './dto/add-package-term.dto';
import { RemovePackageTermDto } from './dto/remove-package-term.dto';
import { BulkUpsertPackageTermsDto } from './dto/bulk-upsert-package-terms.dto';
import { FindAllTermsQueryDto } from './dto/find-all-terms-query.dto';
import { TERM_SCOPE } from './types/term-scope.types';
import { EXCEPTION_RESPONSE } from '../config/errors/exception-response.config';
import { plainToInstance } from 'class-transformer';
import { TermDto } from './dto/term.dto';

@Injectable()
export class TermsService {
  private readonly logger = new Logger(TermsService.name);

  constructor(
    @InjectRepository(Term)
    private termsRepository: Repository<Term>,
    @InjectRepository(PackageTerm)
    private packageTermsRepository: Repository<PackageTerm>,
  ) {}

  private generateCode(scope: TERM_SCOPE, title: string): string {
    const prefix = scope === TERM_SCOPE.PACKAGE ? 'P-' : 'G-';

    const normalizedTitle = title
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toUpperCase();

    const stopWords = [
      'Y',
      'DE',
      'DEL',
      'LA',
      'LAS',
      'EL',
      'LOS',
      'UN',
      'UNA',
      'UNOS',
      'UNAS',
      'EXTRAS',
    ];

    const words = normalizedTitle
      .split(/\s+/)
      .filter((word) => word.length > 0 && !stopWords.includes(word));

    const codeSuffix = words.map((word) => word.substring(0, 3)).join('');

    return `${prefix}${codeSuffix}`;
  }

  async create(createTermDto: CreateTermDto): Promise<TermDto> {
    try {
      this.logger.log({ createTermDto }, 'Creating term');
      const createCode = this.generateCode(
        createTermDto.scope,
        createTermDto.title,
      );
      const termWithCode = await this.termsRepository.findOne({
        where: { code: createCode },
      });
      if (termWithCode) {
        throw new BadRequestException(
          EXCEPTION_RESPONSE.TERM_CODE_ALREADY_EXISTS,
        );
      }
      const term = this.termsRepository.create({
        ...createTermDto,
        code: createCode,
      });
      const savedTerm = await this.termsRepository.save(term);
      return plainToInstance(TermDto, savedTerm, {
        excludeExtraneousValues: true,
      });
    } catch (error) {
      this.logger.error(error, 'Error creating term');
      throw error;
    }
  }

  async findAll(query: FindAllTermsQueryDto): Promise<TermDto[]> {
    try {
      this.logger.log({ query }, 'Finding all terms');
      const queryBuilder = this.termsRepository.createQueryBuilder('term');

      if (query.scope) {
        queryBuilder.andWhere('term.scope = :scope', { scope: query.scope });
      }

      if (query.q) {
        queryBuilder.andWhere(
          '(term.title ILIKE :q OR term.content ILIKE :q)',
          { q: `%${query.q}%` },
        );
      }

      if (query.scope === TERM_SCOPE.PACKAGE) {
        queryBuilder.leftJoinAndSelect('term.packageTerms', 'packageTerm');
        queryBuilder.leftJoinAndSelect('packageTerm.package', 'package');
      }

      const terms = await queryBuilder.getMany();
      return plainToInstance(TermDto, terms, { excludeExtraneousValues: true });
    } catch (error) {
      this.logger.error(error, 'Error finding all terms');
      throw new BadRequestException(EXCEPTION_RESPONSE.TERM_NOT_FOUND);
    }
  }

  async findOne(id: number): Promise<TermDto> {
    try {
      this.logger.log({ id }, 'Finding term');
      const term = await this.termsRepository.findOne({
        where: { id },
        relations: ['packageTerms', 'packageTerms.package'],
      });
      if (!term) {
        throw new NotFoundException(EXCEPTION_RESPONSE.TERM_NOT_FOUND);
      }
      return plainToInstance(TermDto, term, { excludeExtraneousValues: true });
    } catch (error) {
      this.logger.error(error, 'Error finding term');
      throw error;
    }
  }

  async update(id: number, updateTermDto: UpdateTermDto): Promise<void> {
    try {
      this.logger.log({ id, updateTermDto }, 'Updating term');
      const result = await this.termsRepository.update(id, updateTermDto);
      if (result.affected === 0) {
        throw new NotFoundException(EXCEPTION_RESPONSE.TERM_NOT_FOUND);
      }
    } catch (error) {
      this.logger.error(error, 'Error updating term');
      throw error;
    }
  }

  async remove(id: number): Promise<void> {
    try {
      this.logger.log({ id }, 'Removing term');
      const result = await this.termsRepository.softDelete(id);
      if (result.affected === 0) {
        throw new NotFoundException(EXCEPTION_RESPONSE.TERM_NOT_FOUND);
      }
    } catch (error) {
      this.logger.error(error, 'Error removing term');
      throw error;
    }
  }

  async addPackageTerm(dto: AddPackageTermDto): Promise<PackageTerm> {
    try {
      this.logger.log({ dto }, 'Adding package term');
      const existing = await this.packageTermsRepository.findOne({
        where: { packageId: dto.packageId, termId: dto.termId },
      });

      if (existing) {
        return existing;
      }

      const packageTerm = this.packageTermsRepository.create(dto);
      return await this.packageTermsRepository.save(packageTerm);
    } catch (error) {
      this.logger.error(error, 'Error adding package term');
      throw error;
    }
  }

  async removePackageTerm(dto: RemovePackageTermDto): Promise<void> {
    try {
      this.logger.log({ dto }, 'Removing package term');
      const result = await this.packageTermsRepository.delete({
        packageId: dto.packageId,
        termId: dto.termId,
      });
      if (result.affected === 0) {
        throw new NotFoundException(EXCEPTION_RESPONSE.PACKAGE_TERM_NOT_FOUND);
      }
    } catch (error) {
      this.logger.error(error, 'Error removing package term');
      throw error;
    }
  }

  async bulkUpsertPackageTerms(dto: BulkUpsertPackageTermsDto): Promise<void> {
    try {
      this.logger.log({ dto }, 'Bulk upserting package terms');

      await this.packageTermsRepository.delete({
        termId: dto.termId,
      });

      const newPackageTerms = dto.packageIds.map((packageId) =>
        this.packageTermsRepository.create({
          packageId,
          termId: dto.termId,
        }),
      );

      await this.packageTermsRepository.save(newPackageTerms);
    } catch (error) {
      this.logger.error(error, 'Error bulk upserting package terms');
      throw error;
    }
  }

  async findByPackage(packageId: number): Promise<TermDto[]> {
    try {
      this.logger.log({ packageId }, 'Finding terms by package');
      const terms = await this.termsRepository
        .createQueryBuilder('term')
        .innerJoin('term.packageTerms', 'packageTerm')
        .where('packageTerm.packageId = :packageId', { packageId })
        .getMany();
      return plainToInstance(TermDto, terms, { excludeExtraneousValues: true });
    } catch (error) {
      this.logger.error(error, 'Error finding terms by package');
      throw error;
    }
  }
}
