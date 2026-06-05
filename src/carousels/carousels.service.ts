import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { plainToInstance } from 'class-transformer';
import { CarouselDto } from './dto/carousel.dto';
import { Carousel } from './entities/carousel.entity';

@Injectable()
export class CarouselsService {
  constructor(
    @InjectRepository(Carousel)
    private readonly carouselsRepository: Repository<Carousel>,
  ) {}

  async findByPageSection(
    page: string,
    section: string,
    brandId?: number,
  ): Promise<CarouselDto[]> {
    const carousels = await this.carouselsRepository.find({
      where: {
        page,
        section,
        brandId: brandId !== undefined ? brandId : IsNull(),
        status: 'active',
      },
      order: { sortOrder: 'ASC' },
    });

    return plainToInstance(CarouselDto, carousels, {
      excludeExtraneousValues: true,
    });
  }
}
