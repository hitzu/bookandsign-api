import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { FindOptionsWhere, Repository } from 'typeorm';

import { EXCEPTION_RESPONSE } from '../config/errors/exception-response.config';
import { CreateExtraDto } from './dto/create-extra.dto';
import { ExtraResponseDto } from './dto/extra-response.dto';
import { FindExtrasQueryDto } from './dto/find-extras-query.dto';
import { UpdateExtraDto } from './dto/update-extra.dto';
import { Extra } from './entities/extra.entity';
import { EXTRA_STATUS } from './types/extras-status.types';

@Injectable()
export class ExtrasService {
  private readonly logger = new Logger(ExtrasService.name);

  constructor(
    @InjectRepository(Extra)
    private readonly extrasRepository: Repository<Extra>,
  ) {}

  create(createExtraDto: CreateExtraDto) {
    try {
      this.logger.log({ createExtraDto }, 'Creating extra');
      const extraToSave = this.extrasRepository.create({
        ...createExtraDto,
        description: createExtraDto.description ?? null,
        price: createExtraDto.price ?? null,
        status: createExtraDto.status ?? EXTRA_STATUS.ACTIVE,
      });
      return this.extrasRepository.save(extraToSave);
    } catch (error) {
      this.logger.error(error, 'Error creating extra');
      throw error;
    }
  }

  async findAll(): Promise<ExtraResponseDto[]> {
    try {
      const extras = await this.extrasRepository.find({
        relations: ['brand'],
      });
      return plainToInstance(ExtraResponseDto, extras, {
        excludeExtraneousValues: true,
      });
    } catch (error) {
      this.logger.error(error, 'Error finding all extras');
      throw new BadRequestException(EXCEPTION_RESPONSE.EXTRA_NOT_FOUND);
    }
  }

  async findWithFilters(
    filters: FindExtrasQueryDto,
  ): Promise<ExtraResponseDto[]> {
    try {
      const where: FindOptionsWhere<Extra> = {
        status: EXTRA_STATUS.ACTIVE,
      };
      if (filters.brandId) {
        where.brandId = Number(filters.brandId);
      }

      const extras = await this.extrasRepository.find({
        where,
        relations: ['brand'],
      });
      return plainToInstance(ExtraResponseDto, extras, {
        excludeExtraneousValues: true,
      });
    } catch (error) {
      this.logger.error(error, 'Error finding extras with filters');
      throw new BadRequestException(EXCEPTION_RESPONSE.EXTRA_NOT_FOUND);
    }
  }

  async findOne(id: number): Promise<ExtraResponseDto> {
    try {
      const foundExtra = await this.extrasRepository.findOne({
        where: { id },
        relations: ['brand'],
      });
      if (!foundExtra) {
        throw new NotFoundException(EXCEPTION_RESPONSE.EXTRA_NOT_FOUND);
      }

      return plainToInstance(ExtraResponseDto, foundExtra, {
        excludeExtraneousValues: true,
      });
    } catch (error) {
      this.logger.error(error, 'Error finding extra');
      throw error;
    }
  }

  async update(id: number, updateExtraDto: UpdateExtraDto) {
    try {
      await this.assertExists(id);
      await this.extrasRepository.update(id, updateExtraDto);
      return this.findOne(id);
    } catch (error) {
      this.logger.error(error, 'Error updating extra');
      throw error;
    }
  }

  async remove(id: number) {
    try {
      await this.assertExists(id);
      return this.extrasRepository.softDelete(id);
    } catch (error) {
      this.logger.error(error, 'Error removing extra');
      throw error;
    }
  }

  findExtrasStatus() {
    return Object.values(EXTRA_STATUS);
  }

  private async assertExists(id: number): Promise<void> {
    const foundExtra = await this.extrasRepository.findOne({
      where: { id },
    });

    if (!foundExtra) {
      throw new NotFoundException(EXCEPTION_RESPONSE.EXTRA_NOT_FOUND);
    }
  }
}
