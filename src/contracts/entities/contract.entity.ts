import { Column, Entity, OneToMany } from 'typeorm';

import { BaseTimeEntity } from '../../common/entities/base-time.entity';
import { UseDto } from '../../common/dto/use-dto.decorator';
import { Slot } from '../../slots/entities/slot.entity';
import { ContractDto } from '../dto/contract.dto';
import { ContractPackage } from './contract-package.entity';
import { Payment } from './payment.entity';
import { CONTRACT_STATUS } from '../types/contract-status.types';

@Entity('contracts')
@UseDto(ContractDto)
export class Contract extends BaseTimeEntity {
  @Column('enum', { enum: CONTRACT_STATUS, default: CONTRACT_STATUS.ACTIVE })
  status: CONTRACT_STATUS = CONTRACT_STATUS.ACTIVE;

  @Column('float', { name: 'total_amount', default: 0 })
  totalAmount: number = 0;

  @Column('text')
  token: string;

  @OneToMany(() => Slot, (slot) => slot.contract)
  slots?: Slot[];

  @OneToMany(() => ContractPackage, (item) => item.contract)
  items?: ContractPackage[];

  @OneToMany(() => Payment, (payment) => payment.contract)
  payments?: Payment[];
}
