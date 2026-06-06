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
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';

import { EXCEPTION_RESPONSE } from '../config/errors/exception-response.config';
import { CreateExtraDto } from './dto/create-extra.dto';
import { ExtraResponseDto } from './dto/extra-response.dto';
import { FindExtrasQueryDto } from './dto/find-extras-query.dto';
import { UpdateExtraDto } from './dto/update-extra.dto';
import { ExtrasService } from './extras.service';
import { EXTRA_STATUS } from './types/extras-status.types';

@Controller('extras')
@ApiTags('extras')
@ApiBearerAuth('access-token')
export class ExtrasController {
  constructor(private readonly extrasService: ExtrasService) {}

  @Post()
  @ApiOperation({ summary: 'Create an extra' })
  @ApiBody({ type: CreateExtraDto })
  @ApiCreatedResponse({ description: 'Extra created successfully' })
  @ApiBadRequestResponse({ description: 'Invalid request body' })
  create(@Body() createExtraDto: CreateExtraDto) {
    return this.extrasService.create(createExtraDto);
  }

  @Get('statuses')
  @ApiOperation({ summary: 'List extra statuses' })
  @ApiOkResponse({
    description: 'List of available extra statuses',
    schema: {
      type: 'array',
      items: { type: 'string', enum: Object.values(EXTRA_STATUS) },
    },
  })
  findExtrasStatus() {
    return this.extrasService.findExtrasStatus();
  }

  @Get()
  @ApiOperation({ summary: 'List extras' })
  @ApiQuery({
    name: 'brandId',
    required: false,
    description: 'Filter extras by brand id',
    type: String,
  })
  @ApiOkResponse({
    description: 'Extras found successfully',
    type: ExtraResponseDto,
    isArray: true,
  })
  findAll(@Query(new ValidationPipe()) query: FindExtrasQueryDto) {
    if (query.brandId) {
      return this.extrasService.findWithFilters(query);
    }

    return this.extrasService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an extra by id' })
  @ApiParam({ name: 'id', type: Number, description: 'Extra id' })
  @ApiOkResponse({ description: 'Extra found successfully' })
  @ApiNotFoundResponse({
    description: EXCEPTION_RESPONSE.EXTRA_NOT_FOUND.message,
  })
  findOne(@Param('id') id: string) {
    return this.extrasService.findOne(+id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an extra' })
  @ApiParam({ name: 'id', type: Number, description: 'Extra id' })
  @ApiBody({ type: UpdateExtraDto })
  @ApiOkResponse({ description: 'Extra updated successfully' })
  @ApiBadRequestResponse({ description: 'Invalid request body' })
  @ApiNotFoundResponse({
    description: EXCEPTION_RESPONSE.EXTRA_NOT_FOUND.message,
  })
  update(@Param('id') id: number, @Body() updateExtraDto: UpdateExtraDto) {
    return this.extrasService.update(id, updateExtraDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove (soft delete) an extra' })
  @ApiParam({ name: 'id', type: Number, description: 'Extra id' })
  @ApiOkResponse({ description: 'Extra removed successfully' })
  @ApiNotFoundResponse({
    description: EXCEPTION_RESPONSE.EXTRA_NOT_FOUND.message,
  })
  remove(@Param('id') id: string) {
    return this.extrasService.remove(+id);
  }
}
