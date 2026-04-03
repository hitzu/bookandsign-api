import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { ApiBearerAuth } from '@nestjs/swagger';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { EventResponseDto } from './dto/event-response.dto';
import { BulkPhrasesDto } from './dto/event-phases/bulk-phrases.dto'
import { EventsService } from './events.service';
import { EventTypeService } from './event-type.service';
import { EventPhrasesService } from './event-phrases.service';
import { Public } from '../auth/decorators/public.decorator';
import { EventTypeDto } from './dto/event-types/event-types.dto';
import { PhraseByEventTokenDto } from './dto/event-phases/phrase-by-event-token.dto';

@Controller('events')
@ApiTags('events')
@ApiBearerAuth('access-token')
export class EventsController {
  constructor(
    private readonly eventsService: EventsService,
    private readonly eventTypeService: EventTypeService,
    private readonly eventPhraseService: EventPhrasesService,
  ) { }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create an event' })
  @ApiBody({ type: CreateEventDto })
  @ApiCreatedResponse({
    description: 'Event created successfully',
    type: EventResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Invalid request body' })
  @ApiConflictResponse({ description: 'Event key already exists' })
  create(@Body(new ValidationPipe()) dto: CreateEventDto) {
    return this.eventsService.create(dto);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update an event by id' })
  @ApiParam({ name: 'id', type: Number, description: 'Event id' })
  @ApiBody({ type: UpdateEventDto })
  @ApiOkResponse({
    description: 'Event updated successfully',
    type: EventResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Invalid request body' })
  @ApiNotFoundResponse({ description: 'Event not found' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body(new ValidationPipe()) dto: UpdateEventDto,
  ) {
    return this.eventsService.update(id, dto);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List all events' })
  @ApiOkResponse({
    description: 'Events list',
    type: [EventResponseDto],
  })
  list() {
    return this.eventsService.list();
  }

  @Get('by-key/:key')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get event by key' })
  @ApiParam({ name: 'key', type: String, description: 'Event key (unique identifier)' })
  @ApiOkResponse({
    description: 'Event found',
    type: EventResponseDto,
  })
  @ApiNotFoundResponse({ description: 'Event not found' })
  getByKey(@Param('key') key: string) {
    return this.eventsService.getByKey(key);
  }


  @Get('types')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List all event types' })
  @ApiOkResponse({
    description: 'Event types list',
    type: [EventTypeDto],
  })
  listEventTypes() {
    return this.eventTypeService.listEventTypes();
  }

  @Get('phrases/:token')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List all phrases by event token' })
  @ApiOkResponse({
    description: 'Phrases list',
    type: [PhraseByEventTokenDto],
  })
  @ApiParam({ name: 'token', type: String, description: 'Event token (UUID)' })
  listPhrasesByEventToken(@Param('token') token: string) {
    return this.eventPhraseService.listPhrasesByEventToken(token);
  }

  @Get(':token')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get event by token' })
  @ApiParam({ name: 'token', type: String, description: 'Event token (UUID)' })
  @ApiOkResponse({
    description: 'Event found',
    type: EventResponseDto,
  })
  @ApiNotFoundResponse({ description: 'Event not found' })
  getByToken(@Param('token') token: string) {
    return this.eventsService.getByToken(token);
  }

  @Post('phrases/bulk')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Upload phrases by event type' })
  @ApiNotFoundResponse({ description: 'Event type not found' })
  bulkPhrasesByEventType(
    @Body(new ValidationPipe({ transform: true, whitelist: true }))
    dto: BulkPhrasesDto
  ) {
    return this.eventPhraseService.bulkSeedPhrases(dto)
  }

}