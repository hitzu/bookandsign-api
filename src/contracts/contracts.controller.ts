import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  ParseIntPipe,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiOkResponse,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';

import { AuthUser } from '../auth/decorators/auth-user.decorator';
import { DecodedTokenDto } from '../tokens/dto/decode-token.dto';
import { ContractsService } from './contracts.service';
import { AddItemDto } from './dto/add-item.dto';
import { ContractDetailDto } from './dto/contract-detail.dto';
import { CreateContractFromSlotsDto } from './dto/create-contract-from-slots.dto';
import { UpdateItemDto } from './dto/update-item.dto';
import { ContractDto } from './dto/contract.dto';
import { Public } from '../auth/decorators/public.decorator';
import { CreatePaymentDto } from '../payments/dto/create-payment.dto';
import { PaymentDto } from '../payments/dto/payment.dto';
import { PaymentResponseDto } from '../payments/dto/payment-response.dto';
import { AddContractSlotDto } from './dto/add-contract-slot.dto';

@Controller('contracts')
@ApiTags('contracts')
@ApiBearerAuth('access-token')
export class ContractsController {
  constructor(private readonly contractsService: ContractsService) {}

  @Post()
  @ApiBody({ type: CreateContractFromSlotsDto })
  @ApiOkResponse({ type: ContractDetailDto })
  async create(
    @Body(new ValidationPipe({ transform: true, whitelist: true }))
    dto: CreateContractFromSlotsDto,
  ): Promise<ContractDto> {
    return await this.contractsService.createContract(dto);
  }

  @Get()
  @ApiOkResponse({ type: ContractDto, isArray: true })
  async list(): Promise<ContractDto[]> {
    return await this.contractsService.list();
  }

  @Get(':id')
  @ApiParam({ name: 'id', type: Number })
  @ApiOkResponse({ type: ContractDetailDto })
  async get(@Param('id') id: string): Promise<ContractDetailDto> {
    return await this.contractsService.getDetail(Number(id));
  }

  @Get('/get-by-token/:token')
  @ApiParam({ name: 'token', type: String })
  @ApiOkResponse({ type: ContractDetailDto })
  @Public()
  async getDetailByToken(
    @Param('token') token: string,
  ): Promise<ContractDetailDto> {
    return await this.contractsService.getDetailByToken(token);
  }

  @Post(':id/items')
  @ApiBody({ type: AddItemDto })
  @ApiOkResponse({ type: ContractDetailDto })
  addItem(
    @Param('id') id: string,
    @Body(new ValidationPipe({ transform: true, whitelist: true }))
    dto: AddItemDto,
  ): void {
    this.contractsService.addItem(Number(id), dto);
  }

  @Patch(':id/items/:itemId')
  @ApiBody({ type: UpdateItemDto })
  @ApiOkResponse({ type: ContractDetailDto })
  async updateItem(
    @Param('id') id: string,
    @Param('itemId') itemId: string,
    @Body(new ValidationPipe({ transform: true, whitelist: true }))
    dto: UpdateItemDto,
    @AuthUser() user: DecodedTokenDto,
  ): Promise<ContractDetailDto> {
    return await this.contractsService.updateItemQuantity(
      Number(id),
      Number(itemId),
      dto,
      user.id,
    );
  }

  @Delete(':id/items/:itemId')
  @ApiOkResponse({ type: ContractDetailDto })
  async removeItem(
    @Param('id') id: string,
    @Param('itemId') itemId: string,
    @AuthUser() user: DecodedTokenDto,
  ): Promise<ContractDetailDto> {
    return await this.contractsService.removeItem(
      Number(id),
      Number(itemId),
      user.id,
    );
  }

  @Post(':id/payments')
  @ApiBody({ type: CreatePaymentDto })
  @ApiOkResponse({ type: PaymentResponseDto })
  async createPayment(
    @Param('id', ParseIntPipe) id: number,
    @Body(new ValidationPipe({ transform: true, whitelist: true }))
    dto: CreatePaymentDto,
  ): Promise<PaymentDto> {
    return await this.contractsService.createPayment(id, dto);
  }

  @Get(':id/payments')
  @ApiOkResponse({ type: PaymentResponseDto, isArray: true })
  async listPayments(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<PaymentDto[]> {
    return await this.contractsService.listPayments(id);
  }

  @Post(':id/cancel')
  @ApiOkResponse({ type: ContractDetailDto })
  async cancel(@Param('id') id: string): Promise<ContractDetailDto> {
    return await this.contractsService.cancel(Number(id));
  }

  @Post(':id/reopen')
  @ApiOkResponse({ type: ContractDetailDto })
  async reopen(
    @Param('id') id: string,
    @AuthUser() user: DecodedTokenDto,
  ): Promise<ContractDetailDto> {
    return await this.contractsService.reopen(Number(id), user.id);
  }

  @Post(':id/slots')
  @ApiBody({ type: AddContractSlotDto })
  @ApiOkResponse({ type: ContractDetailDto })
  async createContractSlot(
    @Param('id') id: string,
    @Body(new ValidationPipe({ transform: true, whitelist: true }))
    dto: AddContractSlotDto,
  ): Promise<ContractDetailDto> {
    return await this.contractsService.addContractSlot(Number(id), dto);
  }

  @Delete(':id')
  @ApiParam({ name: 'id', type: Number })
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete a contract (soft delete) and free reserved slots',
    description:
      'Soft-deletes the contract and related snapshots/links, soft-deletes associated reserved slots to free availability, and soft-deletes payments to keep historical records (not returned by default queries).',
  })
  @ApiNoContentResponse({ description: 'Contract deleted (soft delete)' })
  @ApiNotFoundResponse({ description: 'Contract not found' })
  removeContract(@Param('id') id: string): Promise<void> {
    return this.contractsService.removeContract(Number(id));
  }
}
