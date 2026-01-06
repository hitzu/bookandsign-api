import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { DataSource, Repository } from 'typeorm';

import { USER_ROLES } from '../common/types/user-roles.type';
import { User } from '../users/entities/user.entity';
import { Package } from '../packages/entities/package.entity';
import { Contract } from './entities/contract.entity';
import { Payment } from './entities/payment.entity';
import { AddItemDto } from './dto/add-item.dto';
import { AddPaymentDto } from './dto/add-payment.dto';
import { ContractDetailDto } from './dto/contract-detail.dto';
import { CreateContractFromSlotsDto } from './dto/create-contract-from-slots.dto';
import { UpdateItemDto } from './dto/update-item.dto';
import { CONTRACT_STATUS } from './types/contract-status.types';
import { SLOT_STATUS } from '../slots/types/slot-status.types';
import { ContractPackage } from './entities/contract-package.entity';
import { Slot } from '../slots/entities/slot.entity';
import { randomUUID } from 'crypto';
import { ContractDto } from './dto/contract.dto';

@Injectable()
export class ContractsService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Contract)
    private readonly contractsRepository: Repository<Contract>,
    @InjectRepository(Slot)
    private readonly slotsRepository: Repository<Slot>,
    @InjectRepository(ContractPackage)
    private readonly contractPackagesRepository: Repository<ContractPackage>,
    @InjectRepository(Payment)
    private readonly paymentsRepository: Repository<Payment>,
    @InjectRepository(Package)
    private readonly packagesRepository: Repository<Package>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  private async getActorRole(userId: number): Promise<USER_ROLES> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user.role;
  }

  private assertSellerCanMutate(
    contract: Contract,
    actorRole: USER_ROLES,
  ): void {
    const isSeller = actorRole === USER_ROLES.USER;
    if (!isSeller) {
      return;
    }
    if (contract.status === CONTRACT_STATUS.CLOSED) {
      throw new ForbiddenException('Seller cannot modify a closed contract');
    }
  }

  private async recalculateTotals(contractId: number): Promise<number> {
    const items = await this.contractPackagesRepository.find({
      where: { contractId },
      relations: ['package'],
    });
    const totalAmount = items.reduce((sum, item) => {
      const basePrice = item.package?.basePrice ?? 0;
      const discountPercentage = item.package?.discount ?? 0;
      const clampedDiscountPercentage = Math.min(
        100,
        Math.max(0, discountPercentage),
      );
      const discountMultiplier = 1 - clampedDiscountPercentage / 100;
      const unitPrice = basePrice * discountMultiplier;
      return sum + item.quantity * unitPrice;
    }, 0);
    await this.contractsRepository.update(contractId, { totalAmount });
    return totalAmount;
  }

  async createContract(dto: CreateContractFromSlotsDto): Promise<ContractDto> {
    const slot = await this.slotsRepository.findOne({
      where: { id: dto.slotId },
    });
    if (!slot) {
      throw new NotFoundException('Slot not found');
    }
    if (slot.status !== SLOT_STATUS.HELD) {
      throw new ConflictException('Slot is not held');
    }
    if (slot.contractId != null) {
      throw new ConflictException('Slot is already booked');
    }

    const contract = this.contractsRepository.create({
      status: CONTRACT_STATUS.ACTIVE,
      totalAmount: 0,
      token: randomUUID(),
    });
    const savedContract = await this.contractsRepository.save(contract);

    await this.setItems(savedContract.id, dto.packages);

    const totalAmount = await this.recalculateTotals(savedContract.id);
    await this.contractsRepository.update(savedContract.id, { totalAmount });

    return plainToInstance(ContractDto, savedContract, {
      excludeExtraneousValues: true,
    });
  }

  async setItems(contractId: number, dto: AddItemDto[]): Promise<void> {
    const promises = dto.map(async (packageInfo) => {
      const itemToSave = this.contractPackagesRepository.create({
        contractId,
        packageId: packageInfo.packageId,
        quantity: packageInfo.quantity,
        source: packageInfo.source,
      });
      return this.contractPackagesRepository.save(itemToSave);
    });
    await Promise.all(promises);
  }

  addItem(contractId: number, dto: AddItemDto): void {
    console.log('addItem', contractId, dto);
    //pending
  }

  async updateItemQuantity(
    contractId: number,
    itemId: number,
    dto: UpdateItemDto,
    actorUserId: number,
  ): Promise<ContractDetailDto> {
    const actorRole = await this.getActorRole(actorUserId);
    const contract = await this.contractsRepository.findOne({
      where: { id: contractId },
    });
    if (!contract) {
      throw new NotFoundException('Contract not found');
    }
    this.assertSellerCanMutate(contract, actorRole);
    const item = await this.contractPackagesRepository.findOne({
      where: { id: itemId },
    });
    if (!item || item.contractId !== contractId) {
      throw new NotFoundException('Item not found');
    }
    if (dto.quantity != null) {
      if (dto.quantity < 1) {
        throw new UnprocessableEntityException('quantity must be >= 1');
      }
      await this.contractPackagesRepository.update(itemId, {
        quantity: dto.quantity,
      });
    }
    await this.recalculateTotals(contractId);
    return await this.getDetail(contractId);
  }

  async removeItem(
    contractId: number,
    itemId: number,
    actorUserId: number,
  ): Promise<ContractDetailDto> {
    const actorRole = await this.getActorRole(actorUserId);
    const contract = await this.contractsRepository.findOne({
      where: { id: contractId },
    });
    if (!contract) {
      throw new NotFoundException('Contract not found');
    }
    this.assertSellerCanMutate(contract, actorRole);
    const item = await this.contractPackagesRepository.findOne({
      where: { id: itemId },
    });
    if (!item || item.contractId !== contractId) {
      throw new NotFoundException('Item not found');
    }
    await this.contractPackagesRepository.softDelete(itemId);
    await this.recalculateTotals(contractId);
    return await this.getDetail(contractId);
  }

  async addPayment(
    contractId: number,
    dto: AddPaymentDto,
    actorUserId: number,
  ): Promise<ContractDetailDto> {
    const actorRole = await this.getActorRole(actorUserId);
    const contract = await this.contractsRepository.findOne({
      where: { id: contractId },
    });
    if (!contract) {
      throw new NotFoundException('Contract not found');
    }
    this.assertSellerCanMutate(contract, actorRole);
    if (dto.amount <= 0) {
      throw new UnprocessableEntityException('amount must be > 0');
    }
    const paymentToSave = this.paymentsRepository.create({
      contractId,
      amount: dto.amount,
      method: dto.method,
      receivedAt: dto.receivedAt,
      note: dto.note ?? null,
    });
    await this.paymentsRepository.save(paymentToSave);
    const paidAmount = await this.sumPayments(contractId);
    if (paidAmount >= contract.totalAmount && contract.totalAmount > 0) {
      await this.contractsRepository.update(contractId, {
        status: CONTRACT_STATUS.CLOSED,
      });
    }
    return await this.getDetail(contractId);
  }

  private async sumPayments(contractId: number): Promise<number> {
    const result = await this.paymentsRepository
      .createQueryBuilder('payment')
      .select('COALESCE(SUM(payment.amount), 0)', 'sum')
      .where('payment.contract_id = :contractId', { contractId })
      .andWhere('payment.deleted_at IS NULL')
      .getRawOne<{ sum: string }>();
    return Number(result?.sum ?? 0);
  }

  async getDetail(contractId: number): Promise<ContractDetailDto> {
    const contract = await this.contractsRepository.findOne({
      where: { id: contractId },
    });
    if (!contract) {
      throw new NotFoundException('Contract not found');
    }
    const [slots, items, payments, paidAmount] = await Promise.all([
      this.slotsRepository.find({ where: { contractId } }),
      this.contractPackagesRepository.find({
        where: { contractId },
        relations: ['package'],
      }),
      this.paymentsRepository.find({ where: { contractId } }),
      this.sumPayments(contractId),
    ]);
    return plainToInstance(
      ContractDetailDto,
      { contract, slots, items, payments, paidAmount },
      { excludeExtraneousValues: true },
    );
  }

  async listPayments(contractId: number): Promise<Payment[]> {
    await this.getDetail(contractId);
    return await this.paymentsRepository.find({ where: { contractId } });
  }

  async cancel(contractId: number): Promise<ContractDetailDto> {
    const contract = await this.contractsRepository.findOne({
      where: { id: contractId },
    });
    if (!contract) {
      throw new NotFoundException('Contract not found');
    }
    if (contract.status === CONTRACT_STATUS.CANCELED) {
      return await this.getDetail(contractId);
    }
    await this.dataSource.transaction(async (manager) => {
      await manager.getRepository(Contract).update(contractId, {
        status: CONTRACT_STATUS.CANCELED,
      });
      await manager.getRepository(Slot).softDelete({ contractId });
    });
    return await this.getDetail(contractId);
  }

  async reopen(
    contractId: number,
    actorUserId: number,
  ): Promise<ContractDetailDto> {
    const actorRole = await this.getActorRole(actorUserId);
    if (actorRole !== USER_ROLES.ADMIN) {
      throw new ForbiddenException('Only admin can reopen a contract');
    }
    const contract = await this.contractsRepository.findOne({
      where: { id: contractId },
    });
    if (!contract) {
      throw new NotFoundException('Contract not found');
    }
    if (contract.status !== CONTRACT_STATUS.CLOSED) {
      throw new ConflictException('Only closed contracts can be reopened');
    }
    await this.contractsRepository.update(contractId, {
      status: CONTRACT_STATUS.PENDING,
    });
    return await this.getDetail(contractId);
  }
}
