import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreatePackageDto } from './dto/create-package.dto';
import { UpdatePackageDto } from './dto/update-package.dto';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Package } from './entities/package.entity';
import { FindOptionsWhere, Repository } from 'typeorm';
import { AddProductsToPackageDto } from './dto/add-products-package.dto';
import { EXCEPTION_RESPONSE } from '../config/errors/exception-response.config';
import { PackageProduct } from './entities/package-product.entity';
import { FindPackagesQueryDto } from './dto/find-packages-query.dto';
import { PackageResponseDto } from './dto/package-response.dto';
import { plainToInstance } from 'class-transformer';
import { PACKAGE_STATUS } from './types/packages-status.types';

@Injectable()
export class PackagesService {
  private readonly logger = new Logger(PackagesService.name);

  constructor(
    @InjectRepository(Package)
    private packagesRepository: Repository<Package>,
    @InjectRepository(PackageProduct)
    private packageProductsRepository: Repository<PackageProduct>,
  ) {}

  create(createPackageDto: CreatePackageDto) {
    try {
      this.logger.log({ createPackageDto }, 'Creating package');
      const packageToSave = this.packagesRepository.create(createPackageDto);
      return this.packagesRepository.save(packageToSave);
    } catch (error) {
      this.logger.error(error, 'Error creating package');
      throw error;
    }
  }

  async findAll(): Promise<PackageResponseDto[]> {
    try {
      const packages = await this.packagesRepository.find({
        relations: ['brand', 'packageProducts', 'packageProducts.product'],
      });
      if (!packages) {
        throw new NotFoundException(EXCEPTION_RESPONSE.PACKAGE_NOT_FOUND);
      }
      return plainToInstance(PackageResponseDto, packages, {
        excludeExtraneousValues: true,
      });
    } catch (error) {
      this.logger.error(error, 'Error finding all packages');
      throw new BadRequestException(EXCEPTION_RESPONSE.PACKAGE_NOT_FOUND);
    }
  }

  async findWithFilters(
    filters: FindPackagesQueryDto,
  ): Promise<PackageResponseDto[]> {
    try {
      const where: FindOptionsWhere<Package> = {};
      if (filters.brandId) {
        where.brandId = Number(filters.brandId);
      }
      const packages = await this.packagesRepository.find({
        where,
        relations: ['brand', 'packageProducts', 'packageProducts.product'],
      });
      return plainToInstance(PackageResponseDto, packages, {
        excludeExtraneousValues: true,
      });
    } catch (error) {
      this.logger.error(error, 'Error finding packages with filters');
      throw new BadRequestException(EXCEPTION_RESPONSE.PACKAGE_NOT_FOUND);
    }
  }

  async findOne(id: number): Promise<PackageResponseDto | null> {
    try {
      this.logger.log({ id }, 'Finding package');
      const foundPackage = await this.packagesRepository.findOne({
        where: { id },
        relations: ['brand', 'packageProducts', 'packageProducts.product'],
      });
      if (!foundPackage) {
        throw new NotFoundException(EXCEPTION_RESPONSE.PACKAGE_NOT_FOUND);
      }

      return plainToInstance(PackageResponseDto, foundPackage, {
        excludeExtraneousValues: true,
      });
    } catch (error) {
      this.logger.error(error, 'Error finding package');
      throw error;
    }
  }

  async update(id: number, updatePackageDto: UpdatePackageDto) {
    try {
      this.logger.log({ id, updatePackageDto }, 'Updating package');
      return this.packagesRepository.update(id, updatePackageDto);
    } catch (error) {
      this.logger.error(error, 'Error updating package');
      throw error;
    }
  }

  remove(id: number) {
    try {
      this.logger.log({ id }, 'Removing package');
      return this.packagesRepository.softDelete(id);
    } catch (error) {
      this.logger.error(error, 'Error removing package');
      throw error;
    }
  }

  async addProductsToPackage(
    id: number,
    addProductsToPackageDto: AddProductsToPackageDto,
  ) {
    try {
      this.logger.log(
        { id, addProductsToPackageDto },
        'Adding products to package',
      );
      const packageToUpdate = await this.packagesRepository.findOne({
        where: { id },
      });
      if (!packageToUpdate) {
        throw new NotFoundException(EXCEPTION_RESPONSE.PACKAGE_NOT_FOUND);
      }

      await this.packageProductsRepository.delete({ packageId: id });

      const packageProductsToSave = addProductsToPackageDto.products.map(
        (product) =>
          this.packageProductsRepository.create({
            packageId: id,
            productId: product.productId,
            quantity: product.quantity,
          }),
      );
      await this.packageProductsRepository.save(packageProductsToSave);

      return {
        message: 'Products added to package successfully',
      };
    } catch (error) {
      this.logger.error(error, 'Error adding products to package');
      throw error;
    }
  }

  findPackagesStatus() {
    try {
      return Object.values(PACKAGE_STATUS);
    } catch (error) {
      this.logger.error(error, 'Error finding packages by status');
      throw error;
    }
  }
}
