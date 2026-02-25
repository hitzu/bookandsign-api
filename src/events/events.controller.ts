import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
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
import { EventResponseDto } from './dto/event-response.dto';
import { EventsService } from './events.service';
import { Public } from '../auth/decorators/public.decorator';

@Controller('events')
@ApiTags('events')
@ApiBearerAuth('access-token')
export class EventsController {
  constructor(private readonly eventsService: EventsService) { }

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
    return this.eventsService.create({
      contractId: dto.contractId,
      name: dto.name,
      key: dto.key,
      description: dto.description,
    });
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
}
