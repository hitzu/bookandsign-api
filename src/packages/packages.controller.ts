import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ValidationPipe,
  Query,
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
import { PackagesService } from './packages.service';
import { CreatePackageDto } from './dto/create-package.dto';
import { UpdatePackageDto } from './dto/update-package.dto';
import { AddProductsToPackageDto } from './dto/add-products-package.dto';
import { FindPackagesQueryDto } from './dto/find-packages-query.dto';
import { PackageResponseDto } from './dto/package-response.dto';
import { EXCEPTION_RESPONSE } from '../config/errors/exception-response.config';
import { PACKAGE_STATUS } from './types/packages-status.types';

@Controller('packages')
@ApiTags('packages')
@ApiBearerAuth('access-token')
export class PackagesController {
  constructor(private readonly packagesService: PackagesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a package' })
  @ApiBody({ type: CreatePackageDto })
  @ApiCreatedResponse({ description: 'Package created successfully' })
  @ApiBadRequestResponse({ description: 'Invalid request body' })
  create(@Body() createPackageDto: CreatePackageDto) {
    return this.packagesService.create(createPackageDto);
  }

  @Get('statuses')
  @ApiOperation({ summary: 'List package statuses' })
  @ApiOkResponse({
    description: 'List of available package statuses',
    schema: {
      type: 'array',
      items: { type: 'string', enum: Object.values(PACKAGE_STATUS) },
    },
  })
  findPackagesStatus() {
    return this.packagesService.findPackagesStatus();
  }

  @Get()
  @ApiOperation({ summary: 'List packages' })
  @ApiQuery({
    name: 'brandId',
    required: false,
    description: 'Filter packages by brand id',
    type: String,
  })
  @ApiOkResponse({
    description: 'Packages found successfully',
    type: PackageResponseDto,
    isArray: true,
  })
  findAll(@Query(new ValidationPipe()) query: FindPackagesQueryDto) {
    if (query.brandId) {
      return this.packagesService.findWithFilters({ brandId: query.brandId });
    }

    return this.packagesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a package by id' })
  @ApiParam({ name: 'id', type: Number, description: 'Package id' })
  @ApiOkResponse({ description: 'Package found successfully' })
  @ApiNotFoundResponse({
    description: EXCEPTION_RESPONSE.PACKAGE_NOT_FOUND.message,
  })
  findOne(@Param('id') id: string) {
    return this.packagesService.findOne(+id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a package' })
  @ApiParam({ name: 'id', type: Number, description: 'Package id' })
  @ApiBody({ type: UpdatePackageDto })
  @ApiOkResponse({ description: 'Package updated successfully' })
  @ApiBadRequestResponse({ description: 'Invalid request body' })
  @ApiNotFoundResponse({
    description: EXCEPTION_RESPONSE.PACKAGE_NOT_FOUND.message,
  })
  update(@Param('id') id: number, @Body() updatePackageDto: UpdatePackageDto) {
    return this.packagesService.update(id, updatePackageDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove (soft delete) a package' })
  @ApiParam({ name: 'id', type: Number, description: 'Package id' })
  @ApiOkResponse({ description: 'Package removed successfully' })
  @ApiNotFoundResponse({
    description: EXCEPTION_RESPONSE.PACKAGE_NOT_FOUND.message,
  })
  remove(@Param('id') id: string) {
    return this.packagesService.remove(+id);
  }

  @Post(':id/products/bulk')
  @ApiOperation({ summary: 'Replace all products for a package (bulk)' })
  @ApiParam({ name: 'id', type: Number, description: 'Package id' })
  @ApiBody({ type: AddProductsToPackageDto })
  @ApiCreatedResponse({
    description: 'Products added to package successfully',
    schema: {
      type: 'object',
      properties: { message: { type: 'string' } },
      example: { message: 'Products added to package successfully' },
    },
  })
  @ApiBadRequestResponse({ description: 'Invalid request body' })
  @ApiNotFoundResponse({
    description: EXCEPTION_RESPONSE.PACKAGE_NOT_FOUND.message,
  })
  async addProductsToPackage(
    @Param('id') id: number,
    @Body() addProductsToPackageDto: AddProductsToPackageDto,
  ) {
    return this.packagesService.addProductsToPackage(
      id,
      addProductsToPackageDto,
    );
  }
}
