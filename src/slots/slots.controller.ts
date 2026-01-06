import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { EXCEPTION_RESPONSE } from '../config/errors/exception-response.config';
import { BookSlotDto } from './dto/book-slot.dto';
import { FindSlotsQueryDto } from './dto/find-slots-query.dto';
import { HoldSlotDto } from './dto/hold-slot.dto';
import { SlotAvailabilityDto } from './dto/slot-availability.dto';
import { Slot } from './entities/slot.entity';
import { SlotsService } from './slots.service';
import { AuthUser } from '../auth/decorators/auth-user.decorator';
import { DecodedTokenDto } from '../tokens/dto/decode-token.dto';
import { UpdateLeadInfoSlotDto } from './dto/updateLeadInfoSlot.dto';
import { SlotDto } from './dto/slot.dto';

@Controller('slots')
@ApiTags('slots')
@ApiBearerAuth('access-token')
export class SlotsController {
  constructor(private readonly slotsService: SlotsService) {}

  @Get(':id')
  @ApiOperation({ summary: 'Get slot by id' })
  @ApiParam({ name: 'id', type: Number, description: 'Slot id' })
  @ApiOkResponse({ description: 'Slot found successfully', type: Slot })
  @ApiNotFoundResponse({
    description: EXCEPTION_RESPONSE.SLOT_NOT_FOUND.message,
  })
  getById(@Param('id') id: string) {
    return this.slotsService.getById(+id);
  }

  @Get()
  @ApiOperation({ summary: 'Get slot availability for a date' })
  @ApiQuery({
    name: 'date',
    required: true,
    description: 'Event date in YYYY-MM-DD format',
    type: String,
  })
  @ApiOkResponse({
    description: 'Availability for morning/afternoon/evening',
    type: SlotAvailabilityDto,
    isArray: true,
  })
  @ApiBadRequestResponse({ description: 'Invalid query params' })
  findAvailability(@Query(new ValidationPipe()) query: FindSlotsQueryDto) {
    return this.slotsService.getAvailabilityByDate(query.date);
  }

  @Post('hold')
  @ApiOperation({ summary: 'Hold a slot for a date/period' })
  @ApiBody({ type: HoldSlotDto })
  @ApiCreatedResponse({ description: 'Slot held successfully', type: Slot })
  @ApiConflictResponse({
    description: EXCEPTION_RESPONSE.SLOT_NOT_AVAILABLE.message,
  })
  @ApiBadRequestResponse({ description: 'Invalid request body' })
  hold(@Body() holdSlotDto: HoldSlotDto, @AuthUser() user: DecodedTokenDto) {
    const authorId = user.id;
    return this.slotsService.hold({ ...holdSlotDto, authorId });
  }

  @Patch(':id/book')
  @ApiOperation({ summary: 'Book a held slot (attach contractId)' })
  @ApiParam({ name: 'id', type: Number, description: 'Slot id' })
  @ApiBody({ type: BookSlotDto })
  @ApiOkResponse({ description: 'Slot booked successfully', type: SlotDto })
  @ApiNotFoundResponse({
    description: EXCEPTION_RESPONSE.SLOT_NOT_FOUND.message,
  })
  @ApiConflictResponse({
    description: EXCEPTION_RESPONSE.SLOT_ALREADY_BOOKED.message,
  })
  book(@Param('id') id: string, @Body() bookSlotDto: BookSlotDto) {
    return this.slotsService.book(+id, bookSlotDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Cancel (soft delete) a slot' })
  @ApiParam({ name: 'id', type: Number, description: 'Slot id' })
  @ApiOkResponse({ description: 'Slot cancelled successfully' })
  @ApiNotFoundResponse({
    description: EXCEPTION_RESPONSE.SLOT_NOT_FOUND.message,
  })
  cancel(@Param('id') id: string) {
    return this.slotsService.cancel(+id);
  }

  @Patch(':id/lead-info')
  @ApiOperation({ summary: 'Update a slot' })
  @ApiParam({ name: 'id', type: Number, description: 'Slot id' })
  @ApiBody({ type: UpdateLeadInfoSlotDto })
  @ApiOkResponse({ description: 'Slot updated successfully', type: Slot })
  @ApiNotFoundResponse({
    description: EXCEPTION_RESPONSE.SLOT_NOT_FOUND.message,
  })
  updateLeadInfo(
    @Param('id') id: string,
    @Body() leadInfo: UpdateLeadInfoSlotDto,
  ) {
    return this.slotsService.updateLeadInfoSlot(+id, leadInfo);
  }
}
