import { Controller, Get, Param } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { Slot } from './entities/slot.entity';
import { SlotsService } from './slots.service';

@Controller('contracts')
@ApiTags('contracts')
@ApiBearerAuth('access-token')
export class ContractsSlotsController {
  constructor(private readonly slotsService: SlotsService) {}

  @Get(':id/slots')
  @ApiOperation({ summary: 'List active slots by contract id' })
  @ApiParam({ name: 'id', type: Number, description: 'Contract id' })
  @ApiOkResponse({
    description: 'Active slots for a contract',
    type: Slot,
    isArray: true,
  })
  findByContract(@Param('id') id: string) {
    return this.slotsService.findActiveByContractId(+id);
  }
}
