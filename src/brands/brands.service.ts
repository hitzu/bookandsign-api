import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateBrandDto } from './dto/create-brand.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Brand } from './entities/brand.entity';
import { Repository } from 'typeorm';
import { UpdateBrandDto } from './dto/update-brand.dto';
import { Logger } from '@nestjs/common';

@Injectable()
export class BrandsService {
  private readonly logger = new Logger(BrandsService.name);
  constructor(
    @InjectRepository(Brand)
    private brandsRepository: Repository<Brand>,
  ) {}

  async create(createBrandDto: CreateBrandDto) {
    try {
      this.logger.log(
        { brandName: createBrandDto.name, brandKey: createBrandDto.key },
        'Creating brand',
      );
      const brand = this.brandsRepository.create(createBrandDto);
      const savedBrand = await this.brandsRepository.save(brand);
      return savedBrand;
    } catch (error) {
      this.logger.error(error, 'Error creating brand');
      throw new BadRequestException(`${(error as Error).message}`);
    }
  }

  findAll(): Promise<Brand[]> {
    return this.brandsRepository.find();
  }

  findOne(id: number) {
    return `This action returns a #${id} brand`;
  }

  update(id: number, updateBrandDto: UpdateBrandDto) {
    try {
      this.logger.log({ id, updateBrandDto }, 'Updating brand');
      return this.brandsRepository.update(id, updateBrandDto);
    } catch (error) {
      this.logger.error(error, 'Error updating brand');
      throw error;
    }
  }

  remove(id: number) {
    try {
      this.logger.log({ id }, 'Removing brand');
      return this.brandsRepository.softDelete(id);
    } catch (error) {
      this.logger.error(error, 'Error removing brand');
      throw error;
    }
  }
}
