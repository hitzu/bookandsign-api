import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
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
import { FindSlotsQueryDto } from './dto/find-slots-query.dto';
import { GetSlotsCalendarQueryDto } from './dto/get-slots-calendar-query.dto';
import { HoldSlotDto } from './dto/hold-slot.dto';
import { SlotAvailabilityDto } from './dto/slot-availability.dto';
import { SlotsCalendarDto } from './dto/slots-calendar.dto';
import { Slot } from './entities/slot.entity';
import { SlotsService } from './slots.service';
import { Public } from '../auth/decorators/public.decorator';

@Controller('slots')
@ApiTags('slots')
@ApiBearerAuth('access-token')
export class SlotsController {
  constructor(private readonly slotsService: SlotsService) {}

  @Get('calendar')
  @Public()
  @ApiOperation({ summary: 'Get monthly slots calendar (reserved days only)' })
  @ApiQuery({
    name: 'year',
    required: true,
    description: 'Year in YYYY format',
    type: Number,
    example: 2026,
  })
  @ApiQuery({
    name: 'month',
    required: true,
    description: 'Month number (1-12)',
    type: Number,
    example: 1,
  })
  @ApiOkResponse({
    description: 'Monthly calendar with reserved days and slot statuses',
    type: SlotsCalendarDto,
  })
  @ApiBadRequestResponse({ description: 'Invalid query params' })
  getCalendar(@Query(new ValidationPipe()) query: GetSlotsCalendarQueryDto) {
    console.log(query);
    return this.slotsService.getCalendarByMonth(+query.year, +query.month);
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

  @Post('hold')
  @ApiOperation({ summary: 'Hold a slot for a date/period' })
  @ApiBody({ type: HoldSlotDto })
  @ApiCreatedResponse({ description: 'Slot held successfully', type: Slot })
  @ApiConflictResponse({
    description: EXCEPTION_RESPONSE.SLOT_NOT_AVAILABLE.message,
  })
  @ApiBadRequestResponse({ description: 'Invalid request body' })
  hold(@Body() holdSlotDto: HoldSlotDto) {
    return this.slotsService.hold(holdSlotDto);
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
}
