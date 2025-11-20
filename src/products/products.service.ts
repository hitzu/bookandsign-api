import { Injectable } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import { Product } from './entities/product.entity';
import { Logger } from '@nestjs/common';

@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);

  constructor(
    @InjectRepository(Product)
    private productsRepository: Repository<Product>,
  ) {}

  create(createProductDto: CreateProductDto) {
    try {
      this.logger.log({ createProductDto }, 'Creating product');
      const product = this.productsRepository.create(createProductDto);
      return this.productsRepository.save(product);
    } catch (error) {
      this.logger.error(error, 'Error creating product');
      throw error;
    }
  }

  findAll() {
    try {
      this.logger.log('Finding all products');
      return this.productsRepository.find();
    } catch (error) {
      this.logger.error(error, 'Error finding all products');
      throw error;
    }
  }

  findWithFilters(filters: FindOptionsWhere<Product>) {
    try {
      return this.productsRepository.find({ where: filters });
    } catch (error) {
      this.logger.error(error, 'Error finding all products by brand id');
      throw error;
    }
  }

  findOne(id: number) {
    try {
      this.logger.log({ id }, 'Finding one product');
      return this.productsRepository.findOne({ where: { id } });
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
