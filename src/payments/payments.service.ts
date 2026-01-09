import type { Repository } from 'typeorm';

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';

import type { CreatePaymentDto } from './dto/create-payment.dto';
import { PaymentDto } from './dto/payment.dto';
import { Payment } from './entities/payment.entity';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Payment)
    private readonly paymentsRepository: Repository<Payment>,
  ) {}

  async createPayment(
    contractId: number,
    dto: CreatePaymentDto,
  ): Promise<PaymentDto> {
    const payment = this.paymentsRepository.create({
      contractId,
      amount: dto.amount,
      method: dto.method,
      receivedAt: dto.receivedAt,
      note: dto.note ?? null,
      reference: dto.reference ?? null,
    });
    const saved = await this.paymentsRepository.save(payment);
    return plainToInstance(PaymentDto, saved, {
      excludeExtraneousValues: true,
    });
  }

  async listPaymentsByContract(contractId: number): Promise<Payment[]> {
    return await this.paymentsRepository.find({
      where: { contractId },
      order: { createdAt: 'ASC' },
    });
  }
}
