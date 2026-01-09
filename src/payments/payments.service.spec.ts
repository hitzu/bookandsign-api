import type { Repository } from 'typeorm';

import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

import { AppDataSource as TestDataSource } from '../config/database/data-source';
import { ContractFactory } from '../../test/factories/contracts/contract.factory';
import { PaymentFactory } from '../../test/factories/contracts/payment.factory';
import { PAYMENT_METHOD } from '../contracts/types/payment-method.types';
import type { CreatePaymentDto } from './dto/create-payment.dto';
import { Payment } from './entities/payment.entity';
import { PaymentsService } from './payments.service';

describe('PaymentsService', () => {
  let service: PaymentsService;
  let paymentsRepository: Repository<Payment>;
  let contractFactory: ContractFactory;
  let paymentFactory: PaymentFactory;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        PaymentsService,
        { provide: DataSource, useValue: TestDataSource },
        {
          provide: getRepositoryToken(Payment),
          useValue: TestDataSource.getRepository(Payment),
        },
      ],
    }).compile();

    service = module.get(PaymentsService);
    paymentsRepository = module.get<Repository<Payment>>(
      getRepositoryToken(Payment),
    );

    contractFactory = new ContractFactory(TestDataSource);
    paymentFactory = new PaymentFactory(TestDataSource);
  });

  it('creates and persists a valid payment (including note/reference)', async () => {
    const contract = await contractFactory.create();
    const dto: CreatePaymentDto = {
      amount: 100,
      method: PAYMENT_METHOD.CASH,
      receivedAt: new Date('2030-01-01T10:00:00.000Z'),
      note: 'ok',
      reference: 'ref-1',
    };

    const created = await service.createPayment(contract.id, dto);

    expect(created.id).toBeDefined();
    expect(created.contractId).toBe(contract.id);
    expect(created.amount).toBe(dto.amount);
    expect(created.method).toBe(dto.method);
    expect(created.receivedAt).toEqual(dto.receivedAt);
    expect(created.note).toBe(dto.note);
    expect(created.reference).toBe(dto.reference);

    const persisted = await paymentsRepository.findOneByOrFail({
      id: created.id,
    });
    expect(persisted.contractId).toBe(contract.id);
    expect(persisted.amount).toBe(dto.amount);
    expect(persisted.method).toBe(dto.method);
    expect(persisted.receivedAt).toEqual(dto.receivedAt);
    expect(persisted.note).toBe(dto.note);
    expect(persisted.reference).toBe(dto.reference);
  });

  it('defaults note and reference to null when omitted', async () => {
    const contract = await contractFactory.create();
    const dto: CreatePaymentDto = {
      amount: 55.5,
      method: PAYMENT_METHOD.TRANSFER,
      receivedAt: new Date('2030-02-01T12:00:00.000Z'),
    };

    const created = await service.createPayment(contract.id, dto);
    expect(created.note).toBeNull();
    expect(created.reference).toBeNull();
  });

  it('lists payments by contract', async () => {
    const contractA = await contractFactory.create();
    const contractB = await contractFactory.create();

    await paymentFactory.createForContract(contractB);
    const p1 = await paymentFactory.createForContract(contractA);
    const p2 = await paymentFactory.createForContract(contractA);

    const results = await service.listPaymentsByContract(contractA.id);

    expect(results).toHaveLength(2);
    expect(results.map((p) => p.id).sort((a, b) => a - b)).toEqual(
      [p1.id, p2.id].sort((a, b) => a - b),
    );
    expect(results.every((p) => p.contractId === contractA.id)).toBe(true);
    expect(results[0].createdAt.getTime()).toBeLessThanOrEqual(
      results[1].createdAt.getTime(),
    );
  });
});
