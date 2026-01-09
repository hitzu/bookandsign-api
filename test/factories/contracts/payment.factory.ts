import type { FactorizedAttrs } from '@jorgebodega/typeorm-factory';
import { Factory } from '@jorgebodega/typeorm-factory';
import { faker } from '@faker-js/faker';
import type { DataSource } from 'typeorm';

import { Payment } from '../../../src/payments/entities/payment.entity';
import { PAYMENT_METHOD } from '../../../src/contracts/types/payment-method.types';
import { ContractFactory } from './contract.factory';
import { Contract } from '../../../src/contracts/entities/contract.entity';

export class PaymentFactory extends Factory<Payment> {
  protected entity = Payment;
  protected dataSource: DataSource;

  constructor(dataSource: DataSource) {
    super();
    this.dataSource = dataSource;
  }

  protected attrs(): FactorizedAttrs<Payment> {
    return {
      contractId: 0,
      amount: faker.number.float({ min: 1, max: 10000, fractionDigits: 2 }),
      method: faker.helpers.arrayElement<PAYMENT_METHOD>(
        Object.values(PAYMENT_METHOD),
      ),
      receivedAt: faker.date.recent(),
      note: faker.lorem.sentence(),
    };
  }

  async createForContract(
    contract: Contract,
    attrs?: Partial<Payment>,
  ): Promise<Payment> {
    const payment = await this.make({ contractId: contract.id, ...attrs });
    return this.dataSource.getRepository(Payment).save(payment);
  }

  async create(attrs?: Partial<Payment>): Promise<Payment> {
    const contractFactory = new ContractFactory(this.dataSource);
    const contract =
      attrs?.contractId != null
        ? await this.dataSource.getRepository(Contract).findOneByOrFail({
            id: attrs.contractId,
          })
        : await contractFactory.create();
    const payment = await this.make({ contractId: contract.id, ...attrs });
    return this.dataSource.getRepository(Payment).save(payment);
  }
}
