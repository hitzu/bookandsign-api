import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { PinoLogger } from 'nestjs-pino';
import { Repository } from 'typeorm';
import { ServiceTypeDto } from './dto/service-types/service-types.dto';
import { ServiceType } from './entities/service-type.entity';

@Injectable()
export class ServiceTypeService {
  constructor(
    @InjectRepository(ServiceType)
    private readonly serviceTypeRepository: Repository<ServiceType>,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(ServiceTypeService.name);
  }

  async listServiceTypes(): Promise<ServiceTypeDto[]> {
    try {
      const serviceTypes = await this.serviceTypeRepository.find();
      return serviceTypes.map((serviceType) =>
        plainToInstance(ServiceTypeDto, serviceType, {
          excludeExtraneousValues: true,
        }),
      );
    } catch (error) {
      this.logger.error(error, 'Error listing service types');
      throw error;
    }
  }
}
