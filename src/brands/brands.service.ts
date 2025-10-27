import { Injectable } from '@nestjs/common';
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

  create(createBrandDto: CreateBrandDto) {
    try {
      this.logger.log(
        { brandName: createBrandDto.name, brandKey: createBrandDto.key },
        'Creating brand',
      );
      const brand = this.brandsRepository.create(createBrandDto);
      return this.brandsRepository.save(brand);
    } catch (error) {
      this.logger.error(error, 'Error creating brand');
      throw error;
    }
  }

  findAll(): Promise<Brand[]> {
    return this.brandsRepository.find();
  }

  findOne(id: number) {
    return `This action returns a #${id} brand`;
  }

  update(id: number, updateBrandDto: UpdateBrandDto) {
    return `This action updates a #${id} brand, ${JSON.stringify(updateBrandDto)}`;
  }

  remove(id: number) {
    return `This action removes a #${id} brand`;
  }
}
