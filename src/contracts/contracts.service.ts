import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { DataSource, In, Repository } from 'typeorm';

import { User } from '../users/entities/user.entity';
import { Package } from '../packages/entities/package.entity';
import { CreatePaymentDto } from '../payments/dto/create-payment.dto';
import { PaymentsService } from '../payments/payments.service';
import { Contract } from './entities/contract.entity';
import { AddItemDto } from './dto/add-item.dto';
import { ContractDetailDto } from './dto/contract-detail.dto';
import { CreateContractFromSlotsDto } from './dto/create-contract-from-slots.dto';
import { UpdateItemDto } from './dto/update-item.dto';
import { CONTRACT_STATUS } from './types/contract-status.types';
import { SLOT_STATUS } from '../slots/types/slot-status.types';
import { ContractPackage } from './entities/contract-package.entity';
import { Slot } from '../slots/entities/slot.entity';
import { randomUUID } from 'crypto';
import { ContractDto } from './dto/contract.dto';
import { PaymentDto } from 'src/payments/dto/payment.dto';

@Injectable()
export class ContractsService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly paymentsService: PaymentsService,
    @InjectRepository(Contract)
    private readonly contractsRepository: Repository<Contract>,
    @InjectRepository(Slot)
    private readonly slotsRepository: Repository<Slot>,
    @InjectRepository(ContractPackage)
    private readonly contractPackagesRepository: Repository<ContractPackage>,
    @InjectRepository(Package)
    private readonly packagesRepository: Repository<Package>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  private async recalculateTotals(contractId: number): Promise<void> {
    const items = await this.contractPackagesRepository.find({
      where: { contractId },
    });
    const subtotal = items.reduce(
      (sum, item) => sum + item.quantity * item.basePriceSnapshot,
      0,
    );
    await this.contractsRepository.update(contractId, {
      subtotal,
      discountTotal: 0,
      total: subtotal,
    });
  }

  async createContract(dto: CreateContractFromSlotsDto): Promise<ContractDto> {
    const slot = await this.slotsRepository.findOne({
      where: { id: dto.slotId },
    });
    if (!slot) {
      throw new NotFoundException('Slot not found');
    }
    if (slot.status !== SLOT_STATUS.AVAILABLE) {
      throw new ConflictException('Slot is not available');
    }

    const contract = this.contractsRepository.create({
      clientName: null,
      clientPhone: null,
      clientEmail: null,
      subtotal: 0,
      discountTotal: 0,
      total: 0,
      deposit: 0,
      sku: dto.sku,
      token: randomUUID(),
      status: CONTRACT_STATUS.CONFIRMED,
    });
    const savedContract = await this.contractsRepository.save(contract);

    await this.setItems(savedContract.id, dto.packages);

    await this.recalculateTotals(savedContract.id);

    return plainToInstance(ContractDto, savedContract, {
      excludeExtraneousValues: true,
    });
  }

  async setItems(contractId: number, dto: AddItemDto[]): Promise<void> {
    const packages = await this.packagesRepository.findBy({
      id: In(dto.map((p) => p.packageId)),
    });
    const packageById = new Map(packages.map((p) => [p.id, p]));

    await Promise.all(
      dto.map(async (packageInfo) => {
        const pkg = packageById.get(packageInfo.packageId);
        if (!pkg) {
          throw new NotFoundException('Package not found');
        }
        const itemToSave = this.contractPackagesRepository.create({
          contractId,
          packageId: packageInfo.packageId,
          quantity: packageInfo.quantity,
          nameSnapshot: pkg.name,
          basePriceSnapshot: pkg.basePrice ?? 0,
        });
        await this.contractPackagesRepository.save(itemToSave);
      }),
    );
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
    void actorUserId;
    const contract = await this.contractsRepository.findOne({
      where: { id: contractId },
    });
    if (!contract) {
      throw new NotFoundException('Contract not found');
    }
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
    void actorUserId;
    const contract = await this.contractsRepository.findOne({
      where: { id: contractId },
    });
    if (!contract) {
      throw new NotFoundException('Contract not found');
    }
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

  async createPayment(
    contractId: number,
    dto: CreatePaymentDto,
  ): Promise<PaymentDto> {
    const contract = await this.contractsRepository.findOne({
      where: { id: contractId },
    });
    if (!contract) {
      throw new NotFoundException('Contract not found');
    }
    if (contract.status === CONTRACT_STATUS.CANCELLED) {
      throw new ConflictException('Contract is cancelled');
    }
    const payment = await this.paymentsService.createPayment(contractId, dto);
    return plainToInstance(PaymentDto, payment, {
      excludeExtraneousValues: true,
    });
  }

  private async sumPayments(contractId: number): Promise<number> {
    const payments =
      await this.paymentsService.listPaymentsByContract(contractId);
    return payments.reduce((sum, payment) => sum + Number(payment.amount), 0);
  }

  async getDetail(contractId: number): Promise<ContractDetailDto> {
    const contract = await this.contractsRepository.findOne({
      where: { id: contractId },
      relations: ['slot'],
    });
    if (!contract) {
      throw new NotFoundException('Contract not found');
    }
    const [items, payments, paidAmount] = await Promise.all([
      this.contractPackagesRepository.find({
        where: { contractId },
      }),
      this.paymentsService.listPaymentsByContract(contractId),
      this.sumPayments(contractId),
    ]);
    return plainToInstance(
      ContractDetailDto,
      { contract, slot: contract.slot, items, payments, paidAmount },
      { excludeExtraneousValues: true },
    );
  }

  async listPayments(contractId: number): Promise<PaymentDto[]> {
    await this.getDetail(contractId);
    const payments =
      await this.paymentsService.listPaymentsByContract(contractId);
    return plainToInstance(PaymentDto, payments, {
      excludeExtraneousValues: true,
    });
  }

  async cancel(contractId: number): Promise<ContractDetailDto> {
    const contract = await this.contractsRepository.findOne({
      where: { id: contractId },
    });
    if (!contract) {
      throw new NotFoundException('Contract not found');
    }
    if (contract.status === CONTRACT_STATUS.CANCELLED) {
      return await this.getDetail(contractId);
    }
    await this.dataSource.transaction(async (manager) => {
      await manager.getRepository(Contract).update(contractId, {
        status: CONTRACT_STATUS.CANCELLED,
      });
    });
    return await this.getDetail(contractId);
  }

  async reopen(
    contractId: number,
    actorUserId: number,
  ): Promise<ContractDetailDto> {
    void actorUserId;
    const contract = await this.contractsRepository.findOne({
      where: { id: contractId },
    });
    if (!contract) {
      throw new NotFoundException('Contract not found');
    }
    if (contract.status !== CONTRACT_STATUS.CANCELLED) {
      return await this.getDetail(contractId);
    }
    await this.contractsRepository.update(contractId, {
      status: CONTRACT_STATUS.CONFIRMED,
    });
    return await this.getDetail(contractId);
  }

  async getDetailByToken(token: string): Promise<ContractDetailDto> {
    const contract = await this.contractsRepository.findOne({
      where: { token },
      relations: ['slot'],
    });
    if (!contract) {
      throw new NotFoundException('Contract not found');
    }

    const contractId = contract.id;

    const [items, payments, paidAmount] = await Promise.all([
      this.contractPackagesRepository.find({
        where: { contractId },
      }),
      this.paymentsService.listPaymentsByContract(contractId),
      this.sumPayments(contractId),
    ]);

    return plainToInstance(
      ContractDetailDto,
      { contract, slot: contract.slot, items, payments, paidAmount },
      { excludeExtraneousValues: true },
    );
  }
}
