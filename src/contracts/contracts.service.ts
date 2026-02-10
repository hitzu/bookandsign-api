import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { DataSource, In, Repository } from 'typeorm';

import { Package } from '../packages/entities/package.entity';
import { CreatePaymentDto } from '../payments/dto/create-payment.dto';
import { PaymentsService } from '../payments/payments.service';
import { Payment } from '../payments/entities/payment.entity';
import { Contract } from './entities/contract.entity';
import { AddItemDto } from './dto/add-item.dto';
import { ContractDetailDto } from './dto/contract-detail.dto';
import { CreateContractFromSlotsDto } from './dto/create-contract-from-slots.dto';
import { UpdateItemDto } from './dto/update-item.dto';
import { CONTRACT_STATUS } from './types/contract-status.types';
import { ContractPackage } from './entities/contract-package.entity';
import { Slot } from '../slots/entities/slot.entity';
import { SLOT_STATUS } from '../slots/types/slot-status.types';
import { randomUUID } from 'crypto';
import { ContractDto } from './dto/contract.dto';
import { PaymentDto } from 'src/payments/dto/payment.dto';
import { ContractSlot } from './entities/contract-slot.entity';
import { EXCEPTION_RESPONSE } from '../config/errors/exception-response.config';
import { CONTRACT_SLOT_PURPOSE } from './constants/slot_purpose.enum';
import { AddContractSlotDto } from './dto/add-contract-slot.dto';
import { ContractPromotion } from './entities/contract-promotion.entity';

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
    @InjectRepository(ContractSlot)
    private readonly contractSlotsRepository: Repository<ContractSlot>,
  ) { }

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
    const contractSlotValidation = await this.contractSlotsRepository.findOne({
      where: { slotId: dto.slotId },
    });
    if (contractSlotValidation) {
      throw new ConflictException(EXCEPTION_RESPONSE.SLOT_ALREADY_USED);
    }

    const slot = await this.slotsRepository.findOne({
      where: { id: dto.slotId },
    });
    if (!slot) {
      throw new NotFoundException(EXCEPTION_RESPONSE.SLOT_NOT_FOUND);
    }
    if (slot.status !== SLOT_STATUS.RESERVED) {
      throw new ConflictException(EXCEPTION_RESPONSE.SLOT_NOT_AVAILABLE);
    }

    const contract = this.contractsRepository.create({
      userId: dto.userId,
      clientName: dto.clientName,
      clientPhone: dto.clientPhone,
      clientEmail: dto.clientEmail,
      subtotal: dto.subtotal,
      discountTotal: dto.discountTotal,
      total: dto.total,
      sku: dto.sku,
      token: randomUUID(),
      status: CONTRACT_STATUS.CONFIRMED,
      slot,
    });
    const savedContract = await this.contractsRepository.save(contract);

    await this.setItems(savedContract.id, dto.packages);

    const contractSlot = this.contractSlotsRepository.create({
      contractId: savedContract.id,
      slotId: dto.slotId,
      purpose: CONTRACT_SLOT_PURPOSE.EVENT,
    });
    await this.contractSlotsRepository.save(contractSlot);

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
          promotionId: packageInfo.promotionId,
          nameSnapshot: pkg.name,
          basePriceSnapshot: pkg.basePrice || 0,
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
      relations: ['slot', 'contractSlots', 'contractSlots.slot'],
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
      {
        contract,
        slot: contract.slot,
        contractSlots: contract.contractSlots,
        items,
        payments,
        paidAmount,
      },
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

  private maskEmail(email: string): string {
    const trimmed = email.trim();
    const at = trimmed.indexOf('@');
    if (at <= 0) return '****';
    const local = trimmed.slice(0, at);
    const domain = trimmed.slice(at + 1);
    const visibleCount = Math.min(local.length, local.length >= 4 ? 4 : 1);
    const visible = local.slice(0, visibleCount);
    if (!domain) return `${visible}****`;
    if (local.length <= visibleCount) return `${local}@${domain}`;
    return `${visible}****@${domain}`;
  }

  private maskPhone(phone: string): string {
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 4) return '***';
    return `***${digits.slice(-4)}`;
  }

  async getDetailByToken(token: string): Promise<ContractDetailDto> {
    const contract = await this.contractsRepository.findOne({
      where: { token },
      relations: ['slot', 'contractSlots', 'contractSlots.slot'],
    });
    if (!contract) {
      throw new NotFoundException('Contract not found');
    }

    const maskedContract = { ...contract };
    maskedContract.clientPhone = this.maskPhone(contract.clientPhone ?? '');
    maskedContract.clientEmail = this.maskEmail(contract.clientEmail ?? '');

    const contractId = contract.id;

    const [packages, payments, paidAmount] = await Promise.all([
      this.contractPackagesRepository.find({
        where: { contractId },
        relations: [
          'package',
          'package.packageProducts',
          'package.packageProducts.product',
          'promotion',
        ],
      }),
      this.paymentsService.listPaymentsByContract(contractId),
      this.sumPayments(contractId),
    ]);

    return plainToInstance(
      ContractDetailDto,
      {
        contract: maskedContract,
        contractSlots: contract.contractSlots,
        packages,
        payments,
        paidAmount,
      },
      { excludeExtraneousValues: true },
    );
  }

  async addContractSlot(
    contractId: number,
    dto: AddContractSlotDto,
  ): Promise<ContractDetailDto> {
    const contract = await this.contractsRepository.findOne({
      where: { id: contractId },
    });
    if (!contract) {
      throw new NotFoundException('Contract not found');
    }
    const contractSlot = this.contractSlotsRepository.create({
      contractId,
      slotId: dto.slotId,
      purpose: dto.purpose,
    });
    await this.contractSlotsRepository.save(contractSlot);
    return await this.getDetail(contractId);
  }

  async list(): Promise<ContractDto[]> {
    const contracts = await this.contractsRepository.find({
      relations: ['slot', 'contractSlots', 'contractSlots.slot'],
    });
    return plainToInstance(ContractDto, contracts, {
      excludeExtraneousValues: true,
    });
  }

  async removeContract(contractId: number): Promise<void> {
    const contract = await this.contractsRepository.findOne({
      where: { id: contractId },
      relations: ['slot'],
    });
    if (!contract) {
      throw new NotFoundException('Contract not found');
    }
    await this.dataSource.transaction(async (manager) => {
      const contractSlots = await manager.getRepository(ContractSlot).find({
        where: { contractId },
      });

      const slotIds = new Set<number>(contractSlots.map((s) => s.slotId));
      if (contract.slot?.id != null) {
        slotIds.add(contract.slot.id);
      }

      await manager.getRepository(ContractSlot).softDelete({ contractId });
      await manager.getRepository(ContractPackage).softDelete({ contractId });
      await manager.getRepository(ContractPromotion).softDelete({ contractId });
      await manager.getRepository(Payment).softDelete({ contractId });

      const slotIdsArray = Array.from(slotIds);
      if (slotIdsArray.length > 0) {
        await manager.getRepository(Slot).softDelete(slotIdsArray);
      }

      await manager.getRepository(Contract).softDelete(contractId);
    });
  }
}
