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
import { PackagesService } from './packages.service';
import { CreatePackageDto } from './dto/create-package.dto';
import { UpdatePackageDto } from './dto/update-package.dto';
import { AddProductsToPackageDto } from './dto/add-products-package.dto';
import { FindPackagesQueryDto } from './dto/find-packages-query.dto';

@Controller('packages')
export class PackagesController {
  constructor(private readonly packagesService: PackagesService) {}

  @Post()
  create(@Body() createPackageDto: CreatePackageDto) {
    return this.packagesService.create(createPackageDto);
  }

  @Get()
  findAll(@Query(new ValidationPipe()) query: FindPackagesQueryDto) {
    if (query.brandId) {
      return this.packagesService.findWithFilters({ brandId: query.brandId });
    }

    return this.packagesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: number) {
    return this.packagesService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: number, @Body() updatePackageDto: UpdatePackageDto) {
    return this.packagesService.update(id, updatePackageDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.packagesService.remove(+id);
  }

  @Post(':id/products/bulk')
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
