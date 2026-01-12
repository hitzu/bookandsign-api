import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { InjectRepository } from '@nestjs/typeorm';
import {
  FindOptionsRelations,
  FindOptionsWhere,
  ILike,
  Repository,
} from 'typeorm';
import { Product } from './entities/product.entity';
import { Logger } from '@nestjs/common';
import { EXCEPTION_RESPONSE } from '../config/errors/exception-response.config';
import { plainToInstance } from 'class-transformer';
import { ProductDto } from './dto/product.dto';
import { FindProductsQueryDto } from './dto/find-products-query.dto';

@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);

  constructor(
    @InjectRepository(Product)
    private productsRepository: Repository<Product>,
  ) {}

  async create(createProductDto: CreateProductDto): Promise<ProductDto> {
    try {
      this.logger.log({ createProductDto }, 'Creating product');
      const product = this.productsRepository.create(createProductDto);
      const savedProduct = await this.productsRepository.save(product);
      return plainToInstance(ProductDto, savedProduct, {
        excludeExtraneousValues: true,
      });
    } catch (error) {
      this.logger.error(error, 'Error creating product');
      throw error;
    }
  }

  async findAll() {
    try {
      this.logger.log('Finding all products');
      const products = await this.productsRepository.find({
        relations: ['brand'],
      });
      return plainToInstance(ProductDto, products, {
        excludeExtraneousValues: true,
      });
    } catch (error) {
      this.logger.error(error, 'Error finding all products');
      throw error;
    }
  }

  async findWithFilters(
    filters: FindProductsQueryDto,
    relations: FindOptionsRelations<Product>,
  ): Promise<ProductDto[]> {
    try {
      const where: FindOptionsWhere<Product> = {};
      if (filters.brandId) {
        where.brandId = Number(filters.brandId);
      }
      if (filters.term) {
        where.name = ILike(`%${filters.term}%`);
      }
      const products = await this.productsRepository.find({
        where,
        relations,
      });
      return plainToInstance(ProductDto, products, {
        excludeExtraneousValues: true,
      });
    } catch (error) {
      this.logger.error(error, 'Error finding all products by brand id');
      throw error;
    }
  }

  async findOne(id: number) {
    try {
      this.logger.log({ id }, 'Finding one product');
      const product = await this.productsRepository.findOne({ where: { id } });
      if (!product) {
        throw new NotFoundException(EXCEPTION_RESPONSE.PRODUCT_NOT_FOUND);
      }
      // return product;
      return plainToInstance(ProductDto, product, {
        excludeExtraneousValues: true,
      });
    } catch (error) {
      this.logger.error(error, 'Error finding one product');
      throw error;
    }
  }

  update(id: number, updateProductDto: UpdateProductDto) {
    try {
      this.logger.log({ id, updateProductDto }, 'Updating product');
      return this.productsRepository.update(id, updateProductDto);
    } catch (error) {
      this.logger.error(error, 'Error updating product');
      throw error;
    }
  }

  remove(id: number) {
    try {
      this.logger.log({ id }, 'Removing product');
      return this.productsRepository.softDelete(id);
    } catch (error) {
      this.logger.error(error, 'Error removing product');
      throw error;
    }
  }
}
